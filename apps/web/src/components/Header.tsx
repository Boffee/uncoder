import { Button, Flex, Heading, HStack } from "@chakra-ui/react";
import { signIn, signOut, useSession } from "next-auth/client";
import React from "react";

export default function Header() {
  const [session, loading] = useSession();

  return (
    <Flex
      as="nav"
      justifyContent="space-between"
      alignItems="center"
      width="100%"
      mb={12}
    >
      <Heading size="lg">Uncoder</Heading>
      <HStack spacing="8">
        {session ? (
          <Button
            bg="transparent"
            display={{ sm: "block", base: "none" }}
            onClick={() => signOut()}
          >
            Sign Out
          </Button>
        ) : (
          <>
            <Button
              variant="ghost"
              display={{ sm: "block", base: "none" }}
              onClick={() => signIn()}
            >
              Sign In
            </Button>
            <Button colorScheme="red" onClick={() => signIn()}>
              Get Started
            </Button>
          </>
        )}
      </HStack>
    </Flex>
  );
}
