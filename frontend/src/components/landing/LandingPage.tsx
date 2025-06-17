import React, { useEffect, useState, useRef, useCallback } from 'react'
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Text,
  VStack,
  HStack,
  Icon,
  useColorModeValue,
} from '@chakra-ui/react'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { FiUserPlus, FiBriefcase, FiBookOpen, FiCamera, FiMessageCircle, FiTwitter, FiInstagram, FiGlobe } from 'react-icons/fi'

type Star = { x: number; y: number; size: number; delay: number };
type Line = { start: { x: number; y: number }; end: { x: number; y: number }; delay: number };
type Orb = { left?: string; right?: string; top?: string; bottom?: string; size: number; color: string; delay: number };

const MotionBox = motion(Box)
const MotionFlex = motion(Flex)
const MotionText = motion(Text)
const MotionHeading = motion(Heading)

// Interactive Dot Component (larger dots)
const InteractiveDot = ({ x, y, delay }: { x: number; y: number; delay: number }) => (
  <MotionBox
    position="absolute"
    left={`${x}%`}
    top={`${y}%`}
    width="8px"
    height="8px"
    bg="white"
    opacity={0.18}
    borderRadius="full"
    initial={{ opacity: 0, scale: 0 }}
    animate={{ opacity: [0.18, 0.4, 0.18], scale: [1, 1.5, 1] }}
    transition={{
      duration: 2.5,
      delay,
      repeat: Infinity,
      repeatType: 'reverse',
    }}
    zIndex={0}
  />
)

// Star, Constellation, GlowOrb, and CursorLight Components
const StarField = () => {
  const [stars, setStars] = useState<Star[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [orbs, setOrbs] = useState<Orb[]>([]);
  const [cursor, setCursor] = useState<{ x: number; y: number }>({ x: -9999, y: -9999 });

  // Generate stars (30-40, 0.5-1px, twinkle only, pure white)
  useEffect(() => {
    const starCount = 35;
    const newStars = Array.from({ length: starCount }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 0.5 + 0.5, // 0.5px to 1px
      delay: Math.random() * 6,
    }));
    setStars(newStars);
  }, []);

  // Generate constellation lines
  useEffect(() => {
    if (stars.length === 0) return;
    const starPositions = stars.map(star => ({
      x: star.x,
      y: star.y,
    }));
    const lineCount = Math.min(5, Math.floor(starPositions.length / 2));
    const newLines = [];
    for (let i = 0; i < lineCount; i++) {
      const startIndex = Math.floor(Math.random() * starPositions.length);
      let endIndex;
      do {
        endIndex = Math.floor(Math.random() * starPositions.length);
      } while (endIndex === startIndex);
      const start = starPositions[startIndex];
      const end = starPositions[endIndex];
      newLines.push({ start, end, delay: Math.random() * 4 });
    }
    setLines(newLines);
  }, [stars]);

  // Generate glow orbs
  useEffect(() => {
    const colors = ['#4B0082', '#9400D3', '#1E90FF', '#4169E1'];
    const newOrbs = [
      { left: '10%', top: '15%', size: Math.random() * 300 + 200, color: colors[0], delay: 0 },
      { right: '15%', bottom: '20%', size: Math.random() * 300 + 200, color: colors[1], delay: 3 },
      { left: '50%', top: '70%', size: Math.random() * 300 + 200, color: colors[2], delay: 6 },
    ];
    setOrbs(newOrbs);
  }, []);

  // Cursor effect
  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      setCursor({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  return (
    <Box position="fixed" top={0} left={0} w="100vw" h="100vh" zIndex={0} pointerEvents="none" overflow="hidden">
      {/* Glow Orbs */}
      {orbs.map((orb, i) => (
        <Box
          key={i}
          className="glow-orb"
          position="absolute"
          left={orb.left}
          right={orb.right}
          top={orb.top}
          bottom={orb.bottom}
          width={`${orb.size}px`}
          height={`${orb.size}px`}
          borderRadius="50%"
          filter="blur(40px)"
          opacity={0.1}
          bg={orb.color}
          style={{
            animation: `float 20s infinite alternate ease-in-out`,
            animationDelay: `${orb.delay}s`,
          }}
        />
      ))}
      {/* Stars */}
      {stars.map((star, i) => (
        <Box
          key={i}
          className="star"
          position="absolute"
          left={`${star.x}%`}
          top={`${star.y}%`}
          width={`${star.size}px`}
          height={`${star.size}px`}
          backgroundColor="#fff"
          borderRadius="50%"
          style={{
            animation: `twinkle 6s infinite ease-in-out`,
            animationDelay: `${star.delay}s`,
            opacity: 1,
          }}
        />
      ))}
      {/* Constellation Lines */}
      {lines.map((line, i) => {
        // Calculate distance and angle
        const dx = line.end.x - line.start.x;
        const dy = line.end.y - line.start.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;
        return (
          <Box
            key={i}
            className="constellation-line"
            position="absolute"
            left={`calc(${line.start.x}% )`}
            top={`calc(${line.start.y}% )`}
            width={`${distance}vw`}
            height="1px"
            bgGradient="linear(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0) 100%)"
            style={{
              transform: `rotate(${angle}deg)`,
              transformOrigin: 'left center',
              opacity: 0.3,
              animation: `fadeInOut 8s infinite ease-in-out`,
              animationDelay: `${line.delay}s`,
            }}
          />
        );
      })}
      {/* Cursor Light */}
      <Box
        className="cursor-effect"
        position="fixed"
        width="200px"
        height="200px"
        borderRadius="50%"
        bg="radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)"
        pointerEvents="none"
        style={{
          left: `${cursor.x}px`,
          top: `${cursor.y}px`,
          opacity: cursor.x === -9999 ? 0 : 1,
          transform: 'translate(-50%, -50%)',
          zIndex: 5,
          transition: 'opacity 0.3s ease',
        }}
      />
      {/* Keyframes for animation */}
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        @keyframes fadeInOut {
          0%, 100% { opacity: 0; }
          50% { opacity: 0.3; }
        }
        @keyframes float {
          0% { transform: translate(0, 0); }
          100% { transform: translate(30px, 30px); }
        }
      `}</style>
    </Box>
  );
};

const LandingPage = () => {
  const { scrollYProgress } = useScroll()
  const y = useTransform(scrollYProgress, [0, 1], [0, -100])
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  const [dots, setDots] = useState<Array<{ x: number; y: number; delay: number }>>([])

  useEffect(() => {
    // Generate random dots
    const newDots = Array.from({ length: 40 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 2,
    }))
    setDots(newDots)
  }, [])

  const features = [
    {
      icon: FiBookOpen,
      title: 'For Knowledge Creators',
      description: 'Create paid courses, exclusive videos, and receive global tips from fans.',
      color: 'blue',
    },
    {
      icon: FiCamera,
      title: 'For Content Creators',
      description: 'License your reels, images, and digital assets to global brands. Own your IP.',
      color: 'orange',
    },
    {
      icon: FiMessageCircle,
      title: 'For Lifestyle Creators',
      description: 'Enable fan clubs, paid DMs, tipping, and premium unlockable content.',
      color: 'purple',
    },
  ]

  return (
    <Box
      minH="100vh"
      bg="gray.900"
      position="relative"
      overflow="hidden"
      color="white"
    >
      {/* Animated Starfield Background */}
      <StarField />

      {/* Interactive Dots */}
      {dots.map((dot, index) => (
        <InteractiveDot key={index} {...dot} />
      ))}

      {/* Animated Background */}
      <MotionBox
        position="absolute"
        top="-100px"
        left="50%"
        width="1200px"
        height="600px"
        bg="radial-gradient(circle at 60% 40%, #1a1a1a 0%, #2d3748 60%, #1a202c 100%)"
        opacity={0.8}
        filter="blur(80px)"
        transform="translateX(-50%)"
        zIndex={0}
        animate={{
          left: ['50%', '55%', '50%'],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          repeatType: 'reverse',
        }}
      />

      <Container maxW="container.xl" position="relative" zIndex={1}>
        <VStack spacing={20} py={20}>
          {/* Hero Section as 3D Laptop */}
          <MotionBox
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            width="full"
            maxW="5xl"
            mx="auto"
            px={4}
            py={8}
            style={{ perspective: '1500px', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}
          >
            <LaptopHero />
          </MotionBox>

          {/* Features Section */}
          <MotionBox
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
            width="full"
            maxW="5xl"
            mx="auto"
            px={4}
          >
            <Flex
              direction={{ base: 'column', md: 'row' }}
              gap={8}
              justify="center"
            >
              {features.map((feature, index) => (
                <MotionBox
                  key={index}
                  whileHover={{ y: -8, boxShadow: '0 0 30px rgba(255,255,255,0.1)' }}
                  bg="rgba(26, 32, 44, 0.8)"
                  backdropFilter="blur(8px)"
                  p={8}
                  borderRadius="3xl"
                  boxShadow="xl"
                  border="1px solid"
                  borderColor={`${feature.color}.200`}
                  flex={1}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                  style={{
                    transform: 'perspective(1000px) rotateX(5deg)',
                    transformStyle: 'preserve-3d',
                    position: 'relative',
                  }}
                  _hover={{
                    transform: 'perspective(1000px) rotateX(0deg)',
                    transition: 'transform 0.3s ease',
                  }}
                >
                  {/* White spotlight behind each box */}
                  <Box
                    position="absolute"
                    top="50%"
                    left="50%"
                    transform="translate(-50%, -50%)"
                    width="110%"
                    height="110%"
                    borderRadius="3xl"
                    bg="white"
                    filter="blur(20px)"
                    opacity={0.07}
                    zIndex={0}
                  />
                  <VStack spacing={3} align="center" position="relative" zIndex={1}>
                    <MotionBox
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      bg={`${feature.color}.900`}
                      borderRadius="full"
                      p={4}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      style={{
                        transform: 'translateZ(20px)',
                      }}
                    >
                      <Icon as={feature.icon} w={8} h={8} color={`${feature.color}.400`} />
                    </MotionBox>
                    <Heading
                      as="h3"
                      fontSize="xl"
                      fontWeight="bold"
                      color="white"
                      textShadow="0 0 10px rgba(255,255,255,0.3)"
                      style={{
                        transform: 'translateZ(30px)',
                      }}
                    >
                      {feature.title}
                    </Heading>
                    <Text
                      color="gray.300"
                      textAlign="center"
                      style={{
                        transform: 'translateZ(20px)',
                      }}
                    >
                      {feature.description}
                    </Text>
                  </VStack>
                </MotionBox>
              ))}
            </Flex>
          </MotionBox>
        </VStack>
      </Container>

      {/* Footer */}
      <Box
        as="footer"
        width="full"
        textAlign="center"
        color="gray.400"
        fontSize="sm"
        py={8}
        bg="rgba(26, 32, 44, 0.9)"
        position="relative"
        zIndex={1}
        mt="auto"
      >
        <HStack spacing={6} justify="center" mb={2}>
          <Icon
            as={FiTwitter}
            w={5}
            h={5}
            _hover={{ color: 'orange.400', transform: 'scale(1.2)' }}
            cursor="pointer"
            transition="all 0.2s"
          />
          <Icon
            as={FiInstagram}
            w={5}
            h={5}
            _hover={{ color: 'orange.400', transform: 'scale(1.2)' }}
            cursor="pointer"
            transition="all 0.2s"
          />
          <Icon
            as={FiGlobe}
            w={5}
            h={5}
            _hover={{ color: 'orange.400', transform: 'scale(1.2)' }}
            cursor="pointer"
            transition="all 0.2s"
          />
        </HStack>
        <Text>
          &copy; 2024 <Text as="span" fontWeight="semibold" color="orange.400">CreatorPay</Text>. Built for global monetization.
        </Text>
      </Box>
    </Box>
  )
}

const LaptopHero = () => {
  const laptopRef = useRef<HTMLDivElement>(null)
  const screenRef = useRef<HTMLDivElement>(null)
  const glareRef = useRef<HTMLDivElement>(null)

  // Mouse movement for tilt and glare (minimal movement)
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!laptopRef.current || !glareRef.current) return
      const rect = laptopRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const centerX = rect.width / 2
      const centerY = rect.height / 2
      // Restrict rotation to a very minimal range
      const rotateY = Math.max(-2, Math.min(2, (centerX - x) / 60))
      const rotateX = Math.max(-2, Math.min(2, (centerY - y) / 60))
      laptopRef.current.style.transform = `rotateX(${10 + rotateX}deg) rotateY(${rotateY}deg)`
      // Glare
      const glareX = (x / rect.width) * 100
      const glareY = (y / rect.height) * 100
      glareRef.current.style.background = `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 60%)`
    }
    const handleMouseLeave = () => {
      if (laptopRef.current) laptopRef.current.style.transform = 'rotateX(10deg) rotateY(0deg)'
      if (glareRef.current) glareRef.current.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 50%)'
    }
    const node = laptopRef.current
    if (node) {
      node.addEventListener('mousemove', handleMouseMove)
      node.addEventListener('mouseleave', handleMouseLeave)
    }
    return () => {
      if (node) {
        node.removeEventListener('mousemove', handleMouseMove)
        node.removeEventListener('mouseleave', handleMouseLeave)
      }
    }
  }, [])

  return (
    <Box
      className="scene"
      width={{ base: '99vw', md: '90vw' }}
      maxW="1200px"
      height={{ base: '400px', md: '75vh' }}
      display="flex"
      justifyContent="center"
      alignItems="center"
      style={{ perspective: '1500px' }}
    >
      <Box
        ref={laptopRef}
        className="laptop-container"
        position="relative"
        width="100%"
        height="100%"
        style={{ transformStyle: 'preserve-3d', transition: 'transform 0.5s ease', transform: 'rotateX(10deg)' }}
      >
        {/* Laptop */}
        <Box className="laptop" position="absolute" width="100%" height="100%" style={{ transformStyle: 'preserve-3d' }}>
          {/* Screen Container */}
          <Box
            className="laptop-screen-container"
            position="absolute"
            width="100%"
            height="80%"
            style={{ transformOrigin: 'bottom', transformStyle: 'preserve-3d', transition: 'transform 1.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}
          >
            {/* Screen */}
            <Box
              className="laptop-screen"
              position="absolute"
              width="100%"
              height="100%"
              bgGradient="linear(145deg, #2a2a2a, #1a1a1a)"
              borderRadius="10px 10px 0 0"
              overflow="hidden"
              boxShadow="0 0 20px rgba(255,255,255,0.1)"
              style={{ transformStyle: 'preserve-3d' }}
            >
              {/* Bezel */}
              <Box
                className="screen-bezel"
                position="absolute"
                width="100%"
                height="100%"
                border="12px solid #888"
                borderRadius="10px 10px 0 0"
                boxSizing="border-box"
                bgGradient="linear(145deg, #a8a8a8, #d1d1d1)"
                style={{ transform: 'translateZ(1px)', boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.2)' }}
              >
                {/* Camera */}
                <Box
                  className="camera"
                  position="absolute"
                  width="8px"
                  height="8px"
                  bg="#333"
                  borderRadius="full"
                  top="6px"
                  left="50%"
                  style={{ transform: 'translateX(-50%) translateZ(3px)', boxShadow: '0 0 5px rgba(0,0,0,0.5)' }}
                >
                  <Box
                    position="absolute"
                    width="4px"
                    height="4px"
                    bg="#222"
                    borderRadius="full"
                    top="2px"
                    left="2px"
                  />
                </Box>
              </Box>
              {/* Display */}
              <Box
                className="screen-display"
                position="absolute"
                width="calc(100% - 24px)"
                height="calc(100% - 24px)"
                margin="12px"
                bg="#000"
                overflow="hidden"
                style={{ transform: 'translateZ(2px)' }}
                display="flex"
                alignItems="center"
                justifyContent="center"
                px={{ base: 2, md: 8 }}
                py={{ base: 2, md: 6 }}
              >
                {/* Content from previous hero section */}
                <VStack spacing={{ base: 4, md: 6 }} align="center" textAlign="center" width="100%" maxW="95%">
                  <MotionBox
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    bgGradient="linear(to-tr, blue.500, orange.400, purple.500)"
                    borderRadius="full"
                    w={{ base: '14', md: '20' }}
                    h={{ base: '14', md: '20' }}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    boxShadow="xl"
                    border="4px solid"
                    borderColor="white"
                  >
                    <Text fontSize={{ base: '2xl', md: '4xl' }} fontWeight="extrabold" color="white" letterSpacing="widest">
                      CP
                    </Text>
                  </MotionBox>
                  <MotionHeading
                    as="h1"
                    fontSize={{ base: 'xl', md: '2xl', lg: '3xl', xl: '4xl' }}
                    fontWeight="black"
                    letterSpacing="tight"
                    color="white"
                    style={{ textShadow: '0 0 20px rgba(255,255,255,0.5)', WebkitTextStroke: '1px rgba(255,255,255,0.3)' }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                  >
                    Monetize Your Content. Globally.
                  </MotionHeading>
                  <MotionText
                    fontSize={{ base: 'sm', md: 'md', lg: 'lg' }}
                    color="gray.300"
                    fontWeight="medium"
                    maxW="2xl"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                  >
                    Creators, fans, and brands — all in one platform. Let creators earn from tips, paid content, fan clubs, and global licensing. Let brands discover and hire them directly.
                  </MotionText>
                  <HStack spacing={4} mt={6} wrap="wrap" justify="center">
                    <Button
                      as={motion.button}
                      whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(99, 102, 241, 0.5)' }}
                      whileTap={{ scale: 0.95 }}
                      bgGradient="linear(to-r, blue.600, orange.400, purple.600)"
                      color="white"
                      size="sm"
                      px={6}
                      py={2}
                      borderRadius="2xl"
                      fontSize={{ base: 'sm', md: 'md' }}
                      fontWeight="bold"
                      boxShadow="xl"
                      _hover={{ bgGradient: 'linear(to-r, blue.700, orange.500, purple.700)', borderColor: 'orange.400' }}
                      border="2px solid"
                      borderColor="transparent"
                      leftIcon={<Icon as={FiUserPlus} />}
                    >
                      Join as Creator or Fan
                    </Button>
                    <Button
                      as={motion.button}
                      whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(6, 182, 212, 0.5)' }}
                      whileTap={{ scale: 0.95 }}
                      variant="outline"
                      border="2px solid"
                      borderColor="blue.500"
                      color="white"
                      size="sm"
                      px={6}
                      py={2}
                      borderRadius="2xl"
                      fontSize={{ base: 'sm', md: 'md' }}
                      fontWeight="bold"
                      bg="transparent"
                      boxShadow="xl"
                      _hover={{ bg: 'whiteAlpha.100', borderColor: 'blue.400' }}
                      leftIcon={<Icon as={FiBriefcase} />}
                    >
                      Join as Brand
                    </Button>
                  </HStack>
                </VStack>
              </Box>
              {/* Glare */}
              <Box
                ref={glareRef}
                className="screen-glare"
                position="absolute"
                top={0}
                left={0}
                width="100%"
                height="100%"
                pointerEvents="none"
                style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 50%)' }}
              />
            </Box>
          </Box>
          {/* Laptop Base */}
          <Box
            className="laptop-base"
            position="absolute"
            width="100%"
            height="30%"
            bottom={0}
            style={{ transformStyle: 'preserve-3d', transform: 'translateY(100%) rotateX(-90deg)', transformOrigin: 'top' }}
          >
            {/* Base Top */}
            <Box
              className="base-top"
              position="absolute"
              width="100%"
              height="100%"
              bgGradient="linear(90deg, #888, #d1d1d1, #888)"
              borderRadius="0 0 10px 10px"
              style={{ transform: 'translateZ(25px)', boxShadow: '0 5px 15px rgba(0,0,0,0.5)' }}
            />
            {/* Base Front */}
            <Box
              className="base-front"
              position="absolute"
              width="100%"
              height="25px"
              bgGradient="linear(to bottom, #a8a8a8, #7a7a7a)"
              style={{ transform: 'rotateX(-90deg) translateZ(25px)', transformOrigin: 'top', borderRadius: '0 0 10px 10px' }}
            />
            {/* Base Bottom */}
            <Box
              className="base-bottom"
              position="absolute"
              width="100%"
              height="100%"
              bg="#555"
              style={{ transform: 'translateZ(0)' }}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

export default LandingPage 