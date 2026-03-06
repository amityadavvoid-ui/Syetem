import time
from playwright.sync_api import sync_playwright, expect

def verify_particle_system():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            # Navigate to the local server
            page.goto("http://localhost:8080/")

            # Wait for the system to initialize
            page.wait_for_timeout(2000)

            # Ensure particles are generated
            container = page.locator("#bgParticles")
            expect(container).to_be_visible()

            # Wait to ensure multiple particles have spawned
            page.wait_for_timeout(3000)

            # Check the number of particles
            particle_count = container.locator(".crystal-particle").count()
            print(f"Number of active particles: {particle_count}")

            # Evaluate script to ensure our loop is running and activeParticles length matches DOM
            js_count = page.evaluate("activeParticles.length")
            print(f"Number of particles in activeParticles array: {js_count}")

            # Assert they match, or at least that some particles are spawned
            assert particle_count > 0, "No particles were spawned"
            assert particle_count == js_count, "DOM particle count does not match JS activeParticles array length"

            # Take a screenshot to visually verify particles
            page.screenshot(path="verification/verify_particles.png")
            print("Particle verification passed. Screenshot saved.")

        except Exception as e:
            print(f"Verification failed: {e}")
            raise e
        finally:
            browser.close()

if __name__ == "__main__":
    verify_particle_system()
