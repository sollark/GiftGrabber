import NextAuth from "next-auth/next";

const handler = NextAuth({
    async session({session}) {
    }

    async signIn({email, password}) {}

});