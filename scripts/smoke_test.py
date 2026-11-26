"""Smoke-test a PUBLIC deployment using only Python standard library.

Usage: python scripts/smoke_test.py https://YOUR-WEBSITE.onrender.com
This tests health, routes and model readiness. It does NOT prove field accuracy,
secure public operation, or shop-owner/admin integration without manual checks.
"""
from __future__ import annotations
import json, sys, urllib.request, urllib.error

if len(sys.argv) < 2 or not sys.argv[1].startswith('https://'):
    print('Usage: python scripts/smoke_test.py https://YOUR-WEBSITE.onrender.com')
    raise SystemExit(2)
base=sys.argv[1].rstrip('/')
checks=['/','/detect','/shops','/login','/api/readiness','/api/model/status']
failed=False
for route in checks:
    try:
        req=urllib.request.Request(base+route,headers={'User-Agent':'krushak-smoke-test/1.0'})
        with urllib.request.urlopen(req,timeout=45) as response:
            code=response.status
            content=response.read(4096)
            if route=='/api/readiness':
                payload=json.loads(content)
                if payload.get('status') != 'ready':raise ValueError('Readiness is not ready')
            if route=='/api/model/status':
                payload=json.loads(content)
                print('   MobileNet status:', payload.get('status'), 'classes:',payload.get('classes'))
                if payload.get('status')!='ready':raise ValueError('AI model is not ready')
            if code!=200:raise ValueError(f'HTTP {code}')
            print('PASS',route)
    except Exception as exc:
        print('FAIL',route,str(exc));failed=True
if failed:
    print('PUBLIC SMOKE TEST FAILED. Review Render deploy/runtime logs.')
    raise SystemExit(1)
print('PUBLIC SMOKE TEST PASSED (basic routes only).')
