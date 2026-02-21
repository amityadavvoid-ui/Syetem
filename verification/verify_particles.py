from playwright.sync_api import sync_playwright
import time
import sys

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()
    try:
        page.goto("http://localhost:8080")

        # Wait for UI to load
        page.wait_for_selector("#levelCenter", timeout=5000)

        print("Waiting for particles to spawn...")
        # Spawn chance is 0.3 every 800ms. Wait 10 seconds to ensure some spawn.
        time.sleep(10)

        particles = page.query_selector_all(".crystal-particle")
        count = len(particles)
        print(f"Particles found: {count}")

        if count > 0:
            print("PASS: Particles are spawning.")
            page.screenshot(path="verification/verify_particles.png")
        else:
            print("FAIL: No particles found.")
            browser.close()
            sys.exit(1)

    except Exception as e:
        print(f"Error: {e}")
        browser.close()
        sys.exit(1)

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
