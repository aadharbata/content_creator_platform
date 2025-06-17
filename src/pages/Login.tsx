import React from 'react'
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Stack,
  Text,
  useColorModeValue,
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { Link as RouterLink } from 'react-router-dom'

const MotionBox = motion(Box)

const Login = () => {
  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')

  return (
    <Container maxW="lg" py={{ base: '12', md: '24' }} px={{ base: '0', sm: '8' }}>
      <MotionBox
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Stack spacing="8">
          <Stack spacing="6" align="center">
            <Heading size="lg">Welcome back</Heading>
            <Text color="gray.600">
              Don't have an account?{' '}
              <Button
                as={RouterLink}
                to="/signup"
                variant="link"
                color="brand.500"
              >
                Sign up
              </Button>
            </Text>
          </Stack>

          <Box
            py={{ base: '0', sm: '8' }}
            px={{ base: '4', sm: '10' }}
            bg={bgColor}
            boxShadow={{ base: 'none', sm: 'md' }}
            borderRadius={{ base: 'none', sm: 'xl' }}
            borderWidth="1px"
            borderColor={borderColor}
          >
            <Stack spacing="6">
              <Stack spacing="5">
                <FormControl>
                  <FormLabel htmlFor="email">Email</FormLabel>
                  <Input id="email" type="email" />
                </FormControl>

                <FormControl>
                  <FormLabel htmlFor="password">Password</FormLabel>
                  <Input id="password" type="password" />
                </FormControl>
              </Stack>

              <Button
                colorScheme="brand"
                size="lg"
                fontSize="md"
                as={RouterLink}
                to="/"
              >
                Sign in
              </Button>
            </Stack>
          </Box>
        </Stack>
      </MotionBox>
    </Container>
  )
}

export default Login 