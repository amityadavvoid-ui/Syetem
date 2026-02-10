from playwright.sync_api import sync_playwright
import time

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto("http://localhost:8080")

    # Wait for UI to load
    page.wait_for_selector("#bgParticles")

    # Wait for particles to spawn (spawn interval is 800ms)
    # Wait 5 seconds to ensure multiple particles are active
    time.sleep(5)

    # Check if particles exist in DOM
    particles = page.locator(".crystal-particle")
    count = particles.count()
    print(f"Active particles found: {count}")

    if count > 0:
        print("SUCCESS: Particles are spawning.")
    else:
        print("FAILURE: No particles found.")

    # Screenshot
    page.screenshot(path="verification/verify_particles_active.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
