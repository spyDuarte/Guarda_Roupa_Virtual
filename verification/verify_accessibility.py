from playwright.sync_api import sync_playwright, expect
import time
import os
import signal
import subprocess

def verify_accessibility():
    # Start the server
    server_process = subprocess.Popen(["python3", "-m", "http.server", "8000"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(2) # Wait for server to start

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page(viewport={"width": 1280, "height": 720})

            # Navigate to the app
            page.goto("http://localhost:8000/index.html")

            # Wait for content
            page.wait_for_selector("#app-root")

            # Check Accessibility on Dashboard (even if hidden)
            print("Checking Dashboard buttons...")
            expect(page.locator("#dashboard-notification-btn")).to_have_attribute("aria-label", "Notificações")
            expect(page.locator("#weather-refresh-btn")).to_have_attribute("aria-label", "Atualizar Localização")

            # Force Navigation to Gallery via JS to bypass Auth/Router
            print("Forcing navigation to Gallery...")
            page.evaluate("""() => {
                document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
                document.getElementById('view-gallery').classList.add('active');
            }""")

            # Wait for gallery to be visible
            expect(page.locator("#view-gallery")).to_be_visible()

            # Check Gallery buttons
            print("Checking Gallery buttons...")
            expect(page.locator("#gallery-sort-btn")).to_have_attribute("aria-label", "Ordenar")
            expect(page.locator("#gallery-add-btn")).to_have_attribute("aria-label", "Adicionar Item")

            # Take screenshot of Gallery
            page.screenshot(path="verification/gallery_accessibility.png")
            print("Screenshot saved to verification/gallery_accessibility.png")

            # Check Planner Accessibility
            print("Checking Planner buttons...")
            # We don't need to navigate to planner to check attributes if they are in DOM,
            # but let's stick to what we see.
            expect(page.locator("#planner-prev-month")).to_have_attribute("aria-label", "Mês Anterior")

            # Verify Add Item Overlay
            print("Opening Add Item Overlay...")
            # We can trigger it by clicking the gallery add button since we are in gallery view
            page.click("#gallery-add-btn")
            page.wait_for_selector("#view-add-item", state="visible")

            expect(page.locator("#close-add-item-btn")).to_have_attribute("aria-label", "Fechar")
            expect(page.locator("#camera-btn-mock")).to_have_attribute("aria-label", "Tirar Foto")

            page.screenshot(path="verification/add_item_overlay.png")
            print("Screenshot saved to verification/add_item_overlay.png")

            print("All accessibility checks passed!")

    except Exception as e:
        print(f"Verification failed: {e}")
        raise e
    finally:
        # Kill the server
        os.kill(server_process.pid, signal.SIGTERM)

if __name__ == "__main__":
    verify_accessibility()
