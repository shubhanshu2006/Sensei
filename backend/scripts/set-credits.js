import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  const creditsStr = process.argv[3];

  if (!email || !creditsStr) {
    console.log("Usage: node scripts/set-credits.js <user-email> <credits>");
    console.log("Example: node scripts/set-credits.js candidate@example.com 10");
    process.exit(1);
  }

  const credits = parseInt(creditsStr, 10);
  if (isNaN(credits)) {
    console.error("Error: credits must be a valid number.");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      candidateProfile: true,
      recruiterProfile: true,
    },
  });

  if (!user) {
    console.error(`Error: User with email '${email}' not found.`);
    process.exit(1);
  }

  if (user.candidateProfile) {
    const updated = await prisma.candidateProfile.update({
      where: { id: user.candidateProfile.id },
      data: { practiceCredits: credits },
    });
    console.log(`✓ Successfully updated candidate credits for ${email}:`);
    console.log(`  Total Credits: ${updated.practiceCredits}`);
    console.log(`  Credits Used: ${updated.practiceCreditsUsed}`);
    console.log(`  Available Credits: ${updated.practiceCredits - updated.practiceCreditsUsed}`);
  } else if (user.recruiterProfile) {
    const updated = await prisma.recruiterProfile.update({
      where: { id: user.recruiterProfile.id },
      data: { interviewCredits: credits },
    });
    console.log(`✓ Successfully updated recruiter credits for ${email}:`);
    console.log(`  Interview Credits: ${updated.interviewCredits}`);
  } else {
    console.error(`Error: User ${email} does not have an active candidate or recruiter profile.`);
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Execution failed:", err);
  prisma.$disconnect();
  process.exit(1);
});
