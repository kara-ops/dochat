from unittest.mock import patch, MagicMock
from app.services.token_service import store_refresh_token, verify_refresh_token, blacklist_token, is_blacklisted


# def test_store_refresh_token():
#     mock_redis = MagicMock()

#     with patch("app.services.token_service.get_redis", return_value = mock_redis):
#         store_refresh_token(1,"My_Token")

#         mock_redis.setex.assert_called_once_with(
#             "refresh:1",
#             60*60*24*7,
#             "My_Token"
#         )
        
# def test_verify_refresh_token():
#     mock_redis = MagicMock()

#     with patch("app.services.token_service.get_redis", return_value = mock_redis):
#2 cases 1: token exists redis returns True, 2: token doesnt exists redis returns False
#         mock_redis.get.return_value = "difftoken"
#         result = verify_refresh_token(1,"My_Token")
#         assert result == False
    
def test_blacklist_token():
    mock_redis = MagicMock()

    with patch("app.services.token_service.get_redis", return_value = mock_redis):
        blacklist_token("asufratleader",60)
        
        mock_redis.setex.assert_called_once_with(
            "blacklist:asufratleader",
            60,
            "1"
            
        )
def test_is_blacklisted():
    mock_redis = MagicMock()

    with patch("app.services.token_service.get_redis", return_value = mock_redis):
#2 cases 1: jti exists and redis returns 1, 2: jti doesnt exists redis returns 0
        mock_redis.exists.return_value = 0
        result = is_blacklisted("asufratleader")
        assert result == False


