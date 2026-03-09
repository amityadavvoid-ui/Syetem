from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto("http://localhost:8080")

    # Wait for UI to load
    page.wait_for_selector("#levelCenter")

    print("Checking if particle loops run...")

    # Evaluate global variables via specific code execution within context since they're 'let' bindings.
    # To check `activeParticles`, we can interact with it if it's accessible.
    # In ui.js `activeParticles` is let-scoped in global context, so standard `page.evaluate("activeParticles.length")` works in Playwright's global scope.

    page.wait_for_timeout(2000) # wait a bit for some particles to spawn

    length = page.evaluate("activeParticles.length")
    print(f"Active particles count: {length}")
    if length == 0:
        print("Warning: No particles found yet. Forcing spawn.")
        page.evaluate("for(let i=0; i<5; i++) spawnParticle();")
        page.wait_for_timeout(500)
        length = page.evaluate("activeParticles.length")
        print(f"Active particles count after force spawn: {length}")

    assert length > 0, "Particles should be active"

    # Verify state array instead of simple DOM element array
    is_object = page.evaluate("typeof activeParticles[0] === 'object' && activeParticles[0].element !== undefined")
    assert is_object, "activeParticles should contain state objects with an 'element' property"

    print("Particle state object verified.")
    browser.close()

with sync_playwright() as playwright:
    run(playwright)
