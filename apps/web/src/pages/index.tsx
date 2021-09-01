import { Container } from "@chakra-ui/react";
import Header from "components/Header";
import Hero from "components/Hero";
import type { NextPage } from "next";
import Head from "next/head";

const Home: NextPage = () => {
  return (
    <Container maxW="container.lg" p={8} minH="100vh">
      <Head>
        <title>Uncoder</title>
        <meta name="description" content="Explain code using Codex" />
      </Head>
      <Header />
      <Hero
        title="Understand Code Faster"
        subtitle={`
        Reading other people's code is hard.
        Uncoder makes it eaiser by helping you explain any lines of code on Github.`}
        buttonText="Add to Chrome"
        captionText="powered by Codex"
        imageUrl="https://github.githubassets.com/images/modules/site/home/repo-browser.png"
      />
    </Container>
  );
};

export default Home;
