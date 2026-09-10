const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function run() {
  try {
    const users = await prisma.user.findMany();
    let content = fs.readFileSync('./credentials.md', 'utf8');
    users.forEach(u => {
      content = content.replace(/\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|/g, (match, col1, col2, col3, col4) => {
         if (match.includes(u.email)) {
            return match.replace(/[a-f0-9-]{36}/i, u.id);
         }
         return match;
      });
      
      // For patients (5 columns)
      content = content.replace(/\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|/g, (match) => {
         if (match.includes(u.email)) {
            return match.replace(/[a-f0-9-]{36}/i, u.id);
         }
         return match;
      });
    });
    fs.writeFileSync('./credentials.md', content);
    console.log('Credentials successfully updated with new UUIDs.');
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}
run();
