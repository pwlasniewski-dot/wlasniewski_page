import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
(async () => {
    const cu = await p.challengeUser.findMany({ select: { id: true, email: true, name: true, phone: true } });
    const u = await p.user.findMany({ select: { id: true, email: true, role: true, name: true } });
    const ue = new Set(u.map((x) => x.email.toLowerCase()));
    const collisions = cu.filter((c) => ue.has(c.email.toLowerCase()));
    console.log('ChallengeUsers:', cu.length);
    console.log(JSON.stringify(cu, null, 2));
    console.log('\nUsers total:', u.length, 'role=CLIENT:', u.filter((x) => x.role === 'CLIENT').length);
    console.log(JSON.stringify(u, null, 2));
    console.log('\nEmail collisions (same email in both tables):', collisions.length);
    console.log(JSON.stringify(collisions, null, 2));

    // Are there PhotoChallenges with invitee_user_id set?
    const linked = await p.photoChallenge.count({ where: { invitee_user_id: { not: null } } });
    const total = await p.photoChallenge.count();
    console.log('\nPhotoChallenge: total', total, ', with invitee_user_id linked:', linked);

    await p.$disconnect();
})();
