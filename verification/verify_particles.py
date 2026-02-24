from playwright.sync_api import sync_playwright
import time

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto("http://localhost:8080")

    # Wait for particles to spawn
    print("Waiting for particles to spawn...")
    time.sleep(3)

    # Check if particles exist in DOM
    particle_count = page.evaluate("document.querySelectorAll('.crystal-particle').length")
    print(f"Particles in DOM: {particle_count}")

    # Check activeParticles array
    # Note: top-level let/const are not on window, so we access directly
    active_particles_count = page.evaluate("(() => { try { return activeParticles.length; } catch (e) { return -1; } })()")
    print(f"tracked activeParticles: {active_particles_count}")

    if particle_count > 0 and active_particles_count > 0:
        print("SUCCESS: Particles are spawning and being tracked.")
    else:
        print("FAILURE: No particles found.")
        exit(1)

    # Screenshot
    page.screenshot(path="verification/verify_particles.png")
    print("Screenshot saved to verification/verify_particles.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
