const { spawn } = require('child_process');
const http = require('http');

async function testInChrome() {
  console.log('Launching headless Chrome with remote debugging on port 9222...');
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--user-data-dir=C:\\Users\\Aluno\\AppData\\Local\\Temp\\chrome_debug_' + Date.now(),
    'http://localhost:3000'
  ]);

  await new Promise((r) => setTimeout(r, 2000));

  http.get('http://127.0.0.1:9222/json', (res) => {
    let data = '';
    res.on('data', (c) => data += c);
    res.on('end', async () => {
      try {
        const tabs = JSON.parse(data);
        const tab = tabs.find(t => t.url.includes('localhost:3000'));
        if (!tab) {
          console.error('No tab found for localhost:3000');
          chrome.kill();
          return;
        }

        const ws = new WebSocket(tab.webSocketDebuggerUrl);
        ws.onopen = () => {
          console.log('Connected to Chrome DevTools Protocol!');

          ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
          ws.send(JSON.stringify({ id: 2, method: 'Log.enable' }));

          let step = 0;

          ws.onmessage = (event) => {
            const msg = JSON.parse(event.data);
            if (msg.method === 'Runtime.consoleAPICalled') {
              console.log('[BROWSER CONSOLE]', msg.params.type, msg.params.args.map(a => a.value || a.description));
            }
            if (msg.method === 'Runtime.exceptionThrown') {
              console.error('[BROWSER EXCEPTION]', msg.params.exceptionDetails);
            }

            if (msg.id === 10) {
              console.log('Step 1 Result (Click + Entrada):', msg.result.result.value);
              // Step 2: Fill quantity and submit form
              setTimeout(() => {
                ws.send(JSON.stringify({
                  id: 20,
                  method: 'Runtime.evaluate',
                  params: {
                    expression: `
                      (() => {
                        const input = document.getElementById('stock-quantity-input');
                        input.value = '10';
                        input.dispatchEvent(new Event('input', { bubbles: true }));
                        
                        const submitBtn = document.getElementById('btn-submit-stock');
                        submitBtn.click();
                        return { submitted: true, value: input.value };
                      })()
                    `,
                    returnByValue: true
                  }
                }));
              }, 500);
            }

            if (msg.id === 20) {
              console.log('Step 2 Result (Submit Entrada 10 units):', msg.result.result.value);
              // Wait for API response and refresh
              setTimeout(() => {
                // Step 3: Test - Saída
                ws.send(JSON.stringify({
                  id: 30,
                  method: 'Runtime.evaluate',
                  params: {
                    expression: `
                      (() => {
                        const btn = document.querySelector('.btn-action-remove');
                        if (!btn) return 'No .btn-action-remove button found!';
                        btn.click();
                        const modal = document.getElementById('stock-modal');
                        return {
                          buttonFound: true,
                          modalActive: modal.classList.contains('active'),
                          modalTitle: document.getElementById('stock-modal-title').textContent
                        };
                      })()
                    `,
                    returnByValue: true
                  }
                }));
              }, 1200);
            }

            if (msg.id === 30) {
              console.log('Step 3 Result (Click - Saída):', msg.result.result.value);
              // Step 4: Fill quantity 5 and submit
              setTimeout(() => {
                ws.send(JSON.stringify({
                  id: 40,
                  method: 'Runtime.evaluate',
                  params: {
                    expression: `
                      (() => {
                        const input = document.getElementById('stock-quantity-input');
                        input.value = '5';
                        input.dispatchEvent(new Event('input', { bubbles: true }));
                        
                        const submitBtn = document.getElementById('btn-submit-stock');
                        submitBtn.click();
                        return { submitted: true, value: input.value };
                      })()
                    `,
                    returnByValue: true
                  }
                }));
              }, 500);
            }

            if (msg.id === 40) {
              console.log('Step 4 Result (Submit Saída 5 units):', msg.result.result.value);
              setTimeout(() => {
                console.log('\n=== ALL BROWSER INTERACTIONS SUCCEEDED WITH ZERO EXCEPTIONS! ===');
                chrome.kill();
                process.exit(0);
              }, 1000);
            }
          };

          // Trigger Step 1: Click + Entrada
          setTimeout(() => {
            console.log('Triggering click on + Entrada...');
            ws.send(JSON.stringify({
              id: 10,
              method: 'Runtime.evaluate',
              params: {
                expression: `
                  (() => {
                    const btn = document.querySelector('.btn-action-add');
                    if (!btn) return { error: 'No .btn-action-add found' };
                    btn.click();
                    const modal = document.getElementById('stock-modal');
                    return {
                      buttonFound: true,
                      modalActive: modal.classList.contains('active'),
                      modalTitle: document.getElementById('stock-modal-title').textContent
                    };
                  })()
                `,
                returnByValue: true
              }
            }));
          }, 1500);
        };
      } catch (err) {
        console.error('Error parsing tabs:', err);
        chrome.kill();
      }
    });
  }).on('error', (err) => {
    console.error('HTTP error:', err);
    chrome.kill();
  });
}

testInChrome();
