import { createConnectRouter } from '@connectrpc/connect';
import { connectNodeAdapter } from '@connectrpc/connect-node';
import http from 'http';
import { MemberService } from './gen/src/proto/member/v1/member_connect';
import { memberService } from './services/member.service';

async function main() {
  const adapter = connectNodeAdapter({
    routes: (router) => {
      router.service(MemberService, memberService);
    },
  });
  
  const server = http.createServer((req, res) => {
    // Add CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Connect-Protocol-Version, Connect-Timeout-Ms');
    
    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }
    
    adapter(req, res);
  });

  const port = process.env.PORT ? parseInt(process.env.PORT) : 8080;
  
  server.listen(port, () => {
    console.log(`Connect RPC Server listening on http://localhost:${port}`);
  });
}

if (require.main === module) {
  main().catch(console.error);
}