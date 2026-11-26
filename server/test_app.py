import hashlib, hmac, json, tempfile, time, unittest, threading, urllib.request, urllib.error
from pathlib import Path
from urllib.parse import urlencode
from server.app import validate_init_data, Store, make_server

TOKEN='test-only-not-a-telegram-token'
def signed(uid=123, date=None):
    values={'auth_date':str(int(time.time()) if date is None else date),'query_id':'test-query','user':json.dumps({'id':uid,'first_name':'Test Traveler'})}
    key=hmac.new(b'WebAppData', TOKEN.encode(), hashlib.sha256).digest()
    values['hash']=hmac.new(key, '\n'.join(f'{k}={v}' for k,v in sorted(values.items())).encode(),hashlib.sha256).hexdigest()
    return urlencode(values)

class AccountTests(unittest.TestCase):
    def setUp(self):
        base=Path(__file__).resolve().parents[1]/'.work'
        self.temp=tempfile.TemporaryDirectory(dir=base)
        self.store=Store(Path(self.temp.name)/'test.sqlite3')
        self.save={'version':1,'profile':{},'journey':{'stage':4},'neighborhood':{},'position':{'x':120,'z':-355,'yaw':47},'weather':{'type':'snow'}}
    def tearDown(self): self.temp.cleanup()
    def test_signature_identity_not_client_user_id(self):
        self.assertEqual(validate_init_data(signed(),TOKEN)['id'],'123')
        with self.assertRaises(ValueError): validate_init_data(signed().replace('123','999'),TOKEN)
        with self.assertRaises(ValueError): validate_init_data(signed(),TOKEN+'wrong')
    def test_expired_future_and_duplicate_auth_rejected(self):
        for data in (signed(date=int(time.time())-3601),signed(date=int(time.time())+90),signed()+'&auth_date=0'):
            with self.assertRaises(ValueError): validate_init_data(data,TOKEN)
    def test_accounts_are_isolated_and_persist_across_connections(self):
        self.assertEqual(self.store.write('123',0,self.save),1)
        self.assertIsNone(self.store.read('456')['save'])
        reopened=Store(self.store.path)
        self.assertEqual(reopened.read('123')['save'],self.save)
    def test_revision_conflict_preserves_first_writer(self):
        self.store.write('123',0,self.save)
        self.assertIsNone(self.store.write('123',0,{**self.save,'weather':{'type':'rain'}}))
        self.assertEqual(self.store.read('123')['save']['weather']['type'],'snow')
    def test_tokens_logout_and_validation(self):
        token=self.store.login('123');self.assertEqual(self.store.user(token),'123');self.assertIsNone(self.store.user('forged'))
        self.store.logout(token);self.assertIsNone(self.store.user(token))
        with self.assertRaises(ValueError): self.store.write('123',0,{'version':1})
        with self.assertRaises(ValueError): self.store.write('123',0,{**self.save,'extra':float('nan')})
    def test_http_auth_origin_conflict_and_private_paths(self):
        server=make_server(0,db_path=Path(self.temp.name)/'http.sqlite3',bot_token=TOKEN,origin='http://localhost:18856')
        worker=threading.Thread(target=server.serve_forever,daemon=True);worker.start()
        def req(path,method='GET',body=None,token=None,origin='http://localhost:18856'):
            headers={'Origin':origin,'Content-Type':'application/json'}
            if token: headers['Authorization']='Bearer '+token
            request=urllib.request.Request(f'http://127.0.0.1:{server.server_port}'+path,data=json.dumps(body).encode() if body is not None else None,headers=headers,method=method)
            try:
                with urllib.request.urlopen(request,timeout=3) as r: return r.status,json.load(r)
            except urllib.error.HTTPError as e: return e.code,None
        try:
            self.assertEqual(req('/api/save')[0],401)
            self.assertEqual(req('/api/auth','POST',{'initData':signed()},origin='https://evil.invalid')[0],403)
            code,auth=req('/api/auth','POST',{'initData':signed()});self.assertEqual(code,200)
            self.assertEqual(req('/api/save','PUT',{'revision':0,'save':self.save},auth['token'])[0],200)
            self.assertEqual(req('/api/save','PUT',{'revision':0,'save':self.save},auth['token'])[0],409)
            self.assertEqual(req('/api/save',token=auth['token'])[1]['save'],self.save)
            for path in ('/.work/server/accounts.sqlite3','/server/app.py','/%2e%2e/server/app.py'):
                self.assertEqual(req(path)[0],404)
        finally: server.shutdown();server.server_close();worker.join()

if __name__=='__main__': unittest.main()
