import re
from playwright.sync_api import Page, expect

def test_homepage_redirects_to_login(page: Page):
    # Navigate to the local server
    page.goto("http://localhost:8000")

    # Check that the title is correct
    expect(page).to_have_title(re.compile("Stitch Closet"))

    # Check that it redirects to login (view-login visible, view-dashboard hidden)
    expect(page.locator("#view-login")).to_be_visible()
    expect(page.locator("#view-dashboard")).to_be_hidden()

def test_login_flow(page: Page):
    page.goto("http://localhost:8000")

    # Fill email
    page.fill("input[type='email']", "test@example.com")

    # Click Login button
    # Using text selector is robust here
    page.click("text=Entrar")

    # Should navigate to dashboard
    expect(page.locator("#view-dashboard")).to_be_visible()
    expect(page.locator("#view-login")).to_be_hidden()
