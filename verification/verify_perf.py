from playwright.sync_api import Page, expect, sync_playwright
import time

def test_particles_performance(page: Page):
  page.goto("http://localhost:8080")
  page.wait_for_selector("#bgParticles")

  # Wait for particles to spawn
  time.sleep(3)

  # Ensure there are particles in the DOM
  particles = page.locator(".crystal-particle")
  count = particles.count()
  print(f"Number of active particles: {count}")

  # Take a screenshot
  page.screenshot(path="verification/verify_perf.png")

if __name__ == "__main__":
  with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    try:
      test_particles_performance(page)
    finally:
      browser.close()
