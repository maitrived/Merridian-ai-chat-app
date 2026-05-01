import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
  
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  
  try {
    // Click the Canvas toggle button.
    console.log('Clicking canvas toggle...');
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(el => el.textContent.includes('Canvas'));
      if (btn) btn.click();
    });
    
    // Wait a moment for any crash to happen.
    await new Promise(r => setTimeout(r, 2000));
    
    // Click on the canvas specifically.
    console.log('Clicking inside canvas...');
    await page.evaluate(() => {
      const canvas = document.querySelector('.react-flow__pane');
      if (canvas) canvas.click();
    });
    
    await new Promise(r => setTimeout(r, 2000));
  } catch (e) {
    console.error('Test error:', e);
  }
  
  await browser.close();
})();
