import NextAuth from "next-auth";
import { authOptions } from "../../../../lib/authOptions"; // Caminho relativo corrigido

const handler = NextAuth(authOptions );

export { handler as GET, handler as POST };
