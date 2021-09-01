import { Button, Flex, FlexProps, Heading, Image } from "@chakra-ui/react";
import React from "react";

export type HeroProps = {
  title: string;
  subtitle: string;
  imageUrl: string;
  buttonText: string;
  captionText: string;
} & FlexProps;
export default function Hero({
  title,
  subtitle,
  imageUrl,
  buttonText,
  captionText,
  ...passProps
}: HeroProps) {
  return (
    <Flex
      align="center"
      direction="column"
      maxW="2xl"
      mx="auto"
      mb={16}
      {...passProps}
    >
      <Heading size="2xl" fontWeight="bold" textAlign="center" mb={4}>
        {title}
      </Heading>
      <Heading
        size="md"
        opacity="0.8"
        fontWeight="normal"
        lineHeight={1.5}
        textAlign="center"
        mb={8}
      >
        {subtitle}
      </Heading>
      <Image src={imageUrl} rounded="1rem" shadow="2xl" mb={8} />
      <Button colorScheme="red" size="md">
        {buttonText}
      </Button>
    </Flex>
  );
}
