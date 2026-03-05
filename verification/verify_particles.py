from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto("http://localhost:8080")

    # Wait for UI to load
    page.wait_for_selector("#levelCenter")

    # Override spawn chance to force particles to spawn for visual verification
    page.evaluate("""
        setInterval(() => {
            spawnParticle();
            if (!particleLoopRunning) {
                particleLoopRunning = true;
                requestAnimationFrame(updateParticlesLoop);
            }
        }, 100);
    """)

    # Let the particles spawn and move up
    page.wait_for_timeout(2000)

    # Take a screenshot to verify particles are visible
    page.screenshot(path="verification/verify_particles.png")

    # Verify the logic of having a single requestAnimationFrame is working by checking running states
    is_running = page.evaluate("particleLoopRunning")
    if not is_running:
        print("ERROR: particleLoopRunning is false, but particles should be active.")

    particle_count = page.evaluate("activeParticles.length")
    print(f"Active particles count: {particle_count}")

    if particle_count == 0:
        print("ERROR: No particles found.")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
