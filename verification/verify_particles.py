from playwright.sync_api import sync_playwright
import time

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto("http://localhost:8080")

    # Wait for UI to load
    page.wait_for_selector("#bgParticles")

    print("Waiting for particles to spawn...")
    time.sleep(5)

    # Use evaluate to check the DOM for particles, as activeParticles might not be exposed
    particle_count = page.evaluate("document.getElementById('bgParticles').children.length")
    print(f"DOM Particle count: {particle_count}")

    if particle_count > 0:
        print("Verification PASSED: Particles are spawning.")
    else:
        # Check if activeParticles variable exists in the context (it might not if scoped)
        try:
             count = page.evaluate("activeParticles.length")
             print(f"activeParticles variable count: {count}")
        except Exception as e:
             print(f"Could not access activeParticles variable directly: {e}")

        print("Verification FAILED: No particles found.")
        exit(1)

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
