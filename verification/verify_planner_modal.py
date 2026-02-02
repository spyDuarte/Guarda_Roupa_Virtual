from playwright.sync_api import sync_playwright, expect
import time
import os

def verify_planner_modal(page):
    # Login
    page.goto("http://localhost:8000")
    page.fill("input[type='email']", "test@example.com")
    page.click("text=Entrar")
    expect(page.locator("#view-dashboard")).to_be_visible()

    # Add Top
    page.click(".add-item-trigger")
    expect(page.locator("#view-add-item")).to_be_visible()

    page.click("button[data-value='tops']")
    page.fill("#item-name", "My Top")
    page.click("#save-item-btn")
    expect(page.locator("#view-add-item")).to_be_hidden()

    # Add Bottom
    page.click(".add-item-trigger")
    expect(page.locator("#view-add-item")).to_be_visible()

    page.click("button[data-value='bottoms']")
    page.fill("#item-name", "My Bottom")
    page.click("#save-item-btn")
    expect(page.locator("#view-add-item")).to_be_hidden()

    # Go to Planner
    page.click("button[data-target='planner']")
    expect(page.locator("#view-planner")).to_be_visible()

    # Click "Gerar Look Aleatório"
    page.click("text=Gerar Look Aleatório")

    # Verify Modal "Nomear Look"
    expect(page.locator("h3:has-text('Nomear Look')")).to_be_visible()

    # Take screenshot (relative path)
    time.sleep(0.5)
    page.screenshot(path="verification/planner_modal.png")
    print("Screenshot taken.")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1280, "height": 720})
        try:
            verify_planner_modal(page)
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error.png")
        finally:
            browser.close()
