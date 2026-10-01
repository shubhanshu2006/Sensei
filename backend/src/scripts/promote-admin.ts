import { createClerkClient } from "@clerk/backend";
import { prisma } from "../database/client.js";
import { config } from "../config/index.js";

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();

  if (!email) {
    console.error("Usage: npm run promote-admin <email>");
    console.error("Example: npm run promote-admin user@example.com");
    process.exit(1);
  }

  console.log(`\nPromoting ${email} to PLATFORM_ADMIN...`);

  // 1. Find user in Postgres
  let user = await prisma.user.findUnique({
    where: { email },
    include: { adminProfile: true },
  });

  const clerk = createClerkClient({ secretKey: config.clerk.secretKey });

  // 2. Look up Clerk user
  const clerkUserList = await clerk.users.getUserList({ emailAddress: [email] });
  const clerkUser = clerkUserList.data[0];

  if (!clerkUser && !user) {
    console.error(`❌ User with email "${email}" not found in database or Clerk.`);
    console.log("Please sign up first at http://localhost:3000/sign-up");
    process.exit(1);
  }

  // 3. Update Clerk metadata so frontend allows access
  if (clerkUser) {
    await clerk.users.updateUserMetadata(clerkUser.id, {
      publicMetadata: {
        role: "PLATFORM_ADMIN",
      },
    });
    console.log(`✓ Updated Clerk metadata for ${clerkUser.id} to role: PLATFORM_ADMIN`);
  }

  // 4. Update Postgres database
  if (user) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        role: "PLATFORM_ADMIN",
        adminProfile: {
          upsert: {
            create: {
              isSuperAdmin: true,
              permissions: ["*"],
            },
            update: {
              isSuperAdmin: true,
            },
          },
        },
      },
      include: { adminProfile: true },
    });
    console.log(`✓ Updated Database User (${user.id}) to role: PLATFORM_ADMIN with AdminProfile`);
  } else if (clerkUser) {
    // If user signed up in Clerk but hasn't synced to Postgres yet
    user = await prisma.user.create({
      data: {
        clerkId: clerkUser.id,
        email: email,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        role: "PLATFORM_ADMIN",
        adminProfile: {
          create: {
            isSuperAdmin: true,
            permissions: ["*"],
          },
        },
      },
      include: { adminProfile: true },
    });
    console.log(`✓ Created Database User (${user.id}) with role: PLATFORM_ADMIN and AdminProfile`);
  }

  console.log("\n🎉 Success! You are now a PLATFORM_ADMIN.");
  console.log("You can log in at http://localhost:3000/sign-in and access http://localhost:3000/admin/dashboard\n");
  process.exit(0);
}

main().catch((err) => {
  console.error("Error promoting user:", err);
  process.exit(1);
});
