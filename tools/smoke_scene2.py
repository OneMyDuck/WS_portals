"""Run against the local server; requires Playwright and system Chromium."""
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    for name, width, height in [('portrait', 390, 844), ('landscape', 844, 390)]:
        page = browser.new_page(viewport={'width': width, 'height': height}, has_touch=True)
        errors = []
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.route('**/*', lambda route: route.continue_() if route.request.url.endswith('/dist/playable.html') else route.abort())
        page.goto('http://127.0.0.1:8000/dist/playable.html')
        page.wait_for_function("document.querySelector('.portal-key').disabled === false")
        page.locator('.portal-key').nth(0).tap()
        assert page.locator('#status').inner_text() == 'Этот портал закрыт'
        page.locator('.portal-key').nth(1).tap()
        page.wait_for_function("state === 'scene2'")
        before = page.evaluate('forest.mobs.map(m=>m.x)')
        page.wait_for_timeout(500)
        assert page.evaluate('forest.mobs.map(m=>m.x)') != before
        order = ['boar', 'wolf', 'bear'] if name == 'portrait' else ['bear', 'boar', 'wolf']
        previous_hp = 100
        for index, mob in enumerate(order):
            page.get_by_role('button', name='Атаковать ' + mob, exact=True).tap()
            assert page.evaluate("forest.phase === 'approach'")
            page.wait_for_function("forest.phase === 'fight'")
            assert page.evaluate('forest.target.hp === 100 && forest.events.size === 0')
            if name == 'landscape' and index == 0:
                page.set_viewport_size({'width': 390, 'height': 844})
                page.wait_for_timeout(150)
                page.set_viewport_size({'width': width, 'height': height})
            page.wait_for_function("forest.phase === 'choose' || forest.phase === 'loot'")
            result = page.evaluate('({hp:forest.target.hp,events:[...forest.events],hero:forest.hero.hp})')
            assert result['hp'] == 0
            assert result['events'] == ['hero0', 'mob0', 'hero1', 'mob1', 'hero2', 'mob2']
            assert 3 <= previous_hp - result['hero'] <= 30
            previous_hp = result['hero']
        page.screenshot(path=f'/tmp/scene2-loot-{name}.png')
        page.get_by_role('button', name='UPGRADE — взять меч', exact=True).tap()
        page.wait_for_function("forest.phase === 'absorb'")
        page.wait_for_function("forest.phase === 'show'")
        assert page.evaluate('forest.upgraded && forest.loot === null')
        page.wait_for_timeout(200)
        page.screenshot(path=f'/tmp/scene2-upgraded-{name}.png')
        page.wait_for_function("forest.phase === 'complete'")
        assert previous_hp >= 10
        assert not errors, errors
        print('PASS:', name, 'three fights, exact hit order, damage, loot, upgrade; embedded assets only')
        page.close()
    browser.close()
