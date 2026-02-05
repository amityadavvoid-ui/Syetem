from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto("http://localhost:8080")

    # Wait for UI to load
    page.wait_for_selector("#levelCenter")

    # Screenshot Base (Tier 1)
    page.screenshot(path="verification/verify_tier1.png")

    # Level up to 50 (Tier 1b)
    page.evaluate("player.level = 50; updateUI();")
    page.wait_for_timeout(500)
    page.screenshot(path="verification/verify_tier1b.png")

    # Level up to 71 (Tier 1c)
    page.evaluate("player.level = 71; updateUI();")
    page.wait_for_timeout(500)
    page.screenshot(path="verification/verify_tier1c.png")

    # Level up to 100 (Tier 2)
    page.evaluate("player.level = 100; updateUI();")
    page.wait_for_timeout(500)
    page.screenshot(path="verification/verify_tier2.png")

    # Expand Calendar
    page.click("#toggleCalendarBtn")
    page.wait_for_timeout(500)
    page.screenshot(path="verification/verify_calendar_expanded.png")

    # Open Quest Modal (New Quest)
    page.click("#addQuestBtn")
    page.wait_for_timeout(500)
    page.screenshot(path="verification/verify_quest_modal.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
