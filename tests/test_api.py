from fastapi.testclient import TestClient
import copy
import pytest

from src.app import app, activities

client = TestClient(app)

# Keep a snapshot of original activities to restore between tests
_original = copy.deepcopy(activities)

@pytest.fixture(autouse=True)
def reset_activities():
    # Reset activities to original state before each test
    activities.clear()
    activities.update(copy.deepcopy(_original))
    yield


def test_get_activities():
    r = client.get("/activities")
    assert r.status_code == 200
    data = r.json()
    assert "Chess Club" in data


def test_signup_and_unregister_flow():
    email = "test.student@mergington.edu"

    # Ensure not present
    data = client.get("/activities").json()
    assert email not in data["Chess Club"]["participants"]

    # Sign up
    r = client.post("/activities/Chess%20Club/signup?email=test.student%40mergington.edu")
    assert r.status_code == 200
    assert "Signed up" in r.json()["message"]

    # Participant should appear
    data = client.get("/activities").json()
    assert email in data["Chess Club"]["participants"]

    # Duplicate sign up fails
    r2 = client.post("/activities/Chess%20Club/signup?email=test.student%40mergington.edu")
    assert r2.status_code == 400

    # Unregister
    r3 = client.post("/activities/Chess%20Club/unregister?email=test.student%40mergington.edu")
    assert r3.status_code == 200
    assert "Unregistered" in r3.json()["message"]

    # Participant gone
    data = client.get("/activities").json()
    assert email not in data["Chess Club"]["participants"]


def test_unregister_not_registered():
    r = client.post("/activities/Chess%20Club/unregister?email=nonexistent%40example.com")
    assert r.status_code == 400
