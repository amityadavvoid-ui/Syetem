from playwright.sync_api import sync_playwright
import time

def test_particles():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to the local server
        page.goto("http://localhost:8080/")

        # Wait a bit for particles to spawn
        time.sleep(3)

        # Evaluate performance (check active particles array length)
        # In vanilla JS, activeParticles might not be on window,
        # but we can try to evaluate it if it's in the global scope of the script.
        # However, it's defined with `let` in ui.js, so it's not on `window`.
        # We can just check the DOM elements.
        particle_count = page.evaluate("document.querySelectorAll('.crystal-particle').length")
        print(f"Active particle elements in DOM: {particle_count}")

        # Take a screenshot
        page.screenshot(path="verification/verify_particles_fix.png")

        browser.close()

if __name__ == "__main__":
    test_particles()
