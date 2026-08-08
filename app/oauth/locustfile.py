import uuid
import time
from locust import HttpUser, task, between, LoadTestShape

class BaseAuthUser(HttpUser):
    abstract = True
    
    def on_start(self):
        """
        Creates a new unique user for each Locust client and logs them in.
        This ensures independent database rows and prevents shared state issues.
        """
        self.email = f"testuser_{uuid.uuid4().hex[:8]}@example.com"
        self.password = "LoadTest123!"
        self.access_token = None
        
        # 1. Signup
        with self.client.post("/auth/create-user", json={
            "email": self.email,
            "password": self.password
        }, catch_response=True, name="/auth/create-user") as response:
            if response.status_code in [200, 201, 400, 429]:
                response.success()
        
        # 2. Login
        self.login()

    def login(self):
        with self.client.post("/auth/login", json={
            "email": self.email,
            "password": self.password
        }, catch_response=True, name="/auth/login") as response:
            if response.status_code == 200:
                self.access_token = response.json().get("access_token")
                response.success()
            elif response.status_code == 429:
                response.success()
            else:
                response.failure(f"Login failed: {response.text}")

    def get_auth_header(self):
        return {"Authorization": f"Bearer {self.access_token or 'invalid_token'}"}


class MixedWorkloadUser(BaseAuthUser):
    """
    Scenario 1: Realistic "Day in the Life"
    Simulates users navigating the dashboard, fetching profiles, checking sessions, and occasionally refreshing or logging out.
    """
    wait_time = between(1, 3) # Wait 1-3 seconds between tasks to simulate real human clicking
    weight = 5 # This user type runs 5x more often than the others

    # @task(6) # 60% probability
    # def get_profile(self):
    #     self.client.get("/users/me", headers=self.get_auth_header(), name="/users/me")

    # @task(2) # 20% probability
    # def get_sessions(self):
    #     self.client.get("/auth/get-session", headers=self.get_auth_header(), name="/auth/get-session")

    @task(1) # 10% probability
    def refresh_token(self):
        with self.client.post("/auth/refresh", catch_response=True, name="/auth/refresh") as response:
            if response.status_code == 200:
                self.access_token = response.json().get("access_token")
                response.success()
            else:
                # If refresh fails (e.g. token expired), try to login again
                self.login()

    @task(1) # 10% probability
    def logout_and_login(self):
        self.client.post("/auth/logout", headers=self.get_auth_header(), name="/auth/logout")
        self.access_token = None
        self.login()


class LoginFloodUser(HttpUser):
    """
    Scenario 2: The Login Spike (CPU Bound Testing)
    This user solely focuses on repeatedly logging in, putting maximum strain on the Argon2 threadpool.
    """
    wait_time = between(0.1, 0.5)
    weight = 1

    def on_start(self):
        self.email = f"testuser_{uuid.uuid4().hex[:8]}@example.com"
        self.password = "LoadTest123!"
        with self.client.post("/auth/create-user", json={"email": self.email, "password": self.password}, catch_response=True, name="/auth/create-user") as response:
            if response.status_code in [200, 201, 400, 429]:
                response.success()

    @task
    def hammer_login(self):
        with self.client.post("/auth/login", json={
            "email": self.email,
            "password": self.password
        }, catch_response=True, name="/auth/login [FLOOD]") as response:
            if response.status_code in [200, 429]:
                response.success()
            else:
                response.failure(f"Login failed: {response.status_code}")


class RefreshStormUser(BaseAuthUser):
    """
    Scenario 3: Token Race Condition Validation
    This user rapidly hits the refresh endpoint to attempt to trigger race conditions.
    Validates your Redis single-flight lock mechanism.
    """
    wait_time = between(0.1, 0.2)
    weight = 1

    @task
    def hammer_refresh(self):
        with self.client.post("/auth/refresh", catch_response=True, name="/auth/refresh [STORM]") as response:
            if response.status_code == 200:
                self.access_token = response.json().get("access_token")
                response.success()
            elif response.status_code in [400, 401, 429]:
                response.success() # We expect some 401s if the token is rotated rapidly and cookies get out of sync, which is fine!
            else:
                response.failure(f"Unexpected error: {response.text}")


class SignupFloodUser(HttpUser):
    """
    Scenario 4: Registration Spike (Database Write & CPU Bound Testing)
    This user continuously registers new accounts, generating a new email each time.
    This will massively increase the RPS on /create-user.
    """
    wait_time = between(0.1, 0.5)
    weight = 1

    @task
    def hammer_signup(self):
        email = f"testuser_{uuid.uuid4().hex[:8]}@example.com"
        with self.client.post("/auth/create-user", json={
            "email": email,
            "password": "LoadTest123!"
        }, catch_response=True, name="/auth/create-user [FLOOD]") as response:
            if response.status_code in [200, 201, 400, 429]:
                response.success()
            else:
                response.failure(f"Signup failed: {response.status_code}")
