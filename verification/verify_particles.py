from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto("http://localhost:8080")

    # Wait for UI to load
    page.wait_for_selector("#levelCenter")

    # Let the particles spawn and animation loop to kick in
    page.wait_for_timeout(3000)

    # Screenshot to verify UI works and particles render without crashing
    page.screenshot(path="verification/verify_particles.png")

    # Optional: Log the number of particles found to console to verify spawn logic
    particles_count = page.evaluate("document.querySelectorAll('.crystal-particle').length")
    print(f"Active Particles Rendered: {particles_count}")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
