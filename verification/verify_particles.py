from playwright.sync_api import sync_playwright
import time

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # Capture console logs to debug issues
    page.on("console", lambda msg: print(f"Browser Console: {msg.text}"))

    page.goto("http://localhost:8080")

    # Wait for UI to load
    page.wait_for_selector("#bgParticles", state="visible")

    print("Waiting for particles to spawn...")
    # Increase timeout to 15 seconds to be safe
    try:
        page.wait_for_selector(".crystal-particle", timeout=15000)
    except Exception:
        print("FAIL: No particles spawned within 15 seconds.")
        # Check activeParticles array length
        count = page.evaluate("activeParticles ? activeParticles.length : 'undefined'")
        print(f"activeParticles length: {count}")
        browser.close()
        exit(1)

    particles = page.query_selector_all(".crystal-particle")
    print(f"Initial particle count: {len(particles)}")

    if len(particles) == 0:
        print("FAIL: No particles found.")
        browser.close()
        exit(1)

    # Track the first particle
    first_particle = particles[0]
    initial_transform = first_particle.evaluate("el => el.style.transform")
    print(f"Initial transform: {initial_transform}")

    # Wait a bit for movement
    time.sleep(1)

    try:
        # Re-query
        if not first_particle.is_visible():
             print("Particle disappeared. It might have finished or been removed.")
             # Try to find another one
             particles = page.query_selector_all(".crystal-particle")
             if len(particles) > 0:
                 first_particle = particles[0]
                 initial_transform = first_particle.evaluate("el => el.style.transform")
                 time.sleep(0.5)
             else:
                 print("FAIL: All particles disappeared.")
                 browser.close()
                 exit(1)

        new_transform = first_particle.evaluate("el => el.style.transform")
        print(f"New transform: {new_transform}")

        if initial_transform == new_transform:
            print("FAIL: Particle did not move.")
            browser.close()
            exit(1)
        else:
            print("SUCCESS: Particle moved.")

    except Exception as e:
        print(f"Error checking particle movement: {e}")
        browser.close()
        exit(1)

    page.screenshot(path="verification/verify_particles.png")
    print("Screenshot saved to verification/verify_particles.png")
    browser.close()

with sync_playwright() as playwright:
    run(playwright)
