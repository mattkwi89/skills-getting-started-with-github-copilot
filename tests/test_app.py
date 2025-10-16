from fastapi.testclient import TestClient
from src.app import app, activities

client = TestClient(app)


def test_get_activities():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    # Ensure known activity exists
    assert "Chess Club" in data


def test_signup_and_unregister_flow():
    # Use a unique test email
    test_email = "pytest_user@mergington.edu"
    activity_name = "Programming Class"

    # Ensure test email not already present
    participants = activities[activity_name]["participants"]
    if test_email in participants:
        participants.remove(test_email)

    # Sign up
    signup_resp = client.post(f"/activities/{activity_name}/signup?email={test_email}")
    assert signup_resp.status_code == 200
    assert test_email in activities[activity_name]["participants"]

    # Unregister
    delete_resp = client.delete(f"/activities/{activity_name}/participants?email={test_email}")
    assert delete_resp.status_code == 200
    assert test_email not in activities[activity_name]["participants"]


def test_unregister_nonexistent_participant():
    # Attempt to unregister someone who isn't in the activity
    email = "not_in_activity@mergington.edu"
    resp = client.delete(f"/activities/Chess%20Club/participants?email={email}")
    assert resp.status_code == 404
