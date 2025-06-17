import React, { useState } from 'react';
import {
  Box, Button, FormControl, FormLabel, Input, VStack, Heading, Text, useToast
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem('token', data.token);
        toast({ status: 'success', title: 'Login successful!' });
        navigate('/');
      } else {
        toast({ status: 'error', title: data.message || 'Login failed.' });
      }
    } catch (err) {
      toast({ status: 'error', title: 'Server error.' });
    }
    setLoading(false);
  };

  return (
    <Box minH="100vh" bgGradient="linear(to-br, blue.900, purple.900, orange.400)" display="flex" alignItems="center" justifyContent="center" px={2} py={8}>
      <Box bg="whiteAlpha.900" boxShadow="2xl" borderRadius="2xl" p={{ base: 8, md: 12 }} maxW="md" w="full" textAlign="center">
        <Box bgGradient="linear(to-tr, blue.500, orange.400, purple.500)" borderRadius="full" w={16} h={16} mx="auto" mb={4} display="flex" alignItems="center" justifyContent="center" boxShadow="xl" border="4px solid white">
          <Text color="white" fontSize="2xl" fontWeight="extrabold" letterSpacing="widest">CP</Text>
        </Box>
        <Heading as="h1" fontSize={{ base: '3xl', md: '4xl' }} fontWeight="black" mb={2} color="blue.900">Login</Heading>
        <Text color="gray.700" mb={6}>Welcome back! Please login to your account.</Text>
        <form onSubmit={handleSubmit}>
          <VStack spacing={4} align="stretch">
            <FormControl isRequired>
              <FormLabel>Email</FormLabel>
              <Input name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@email.com" />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Password</FormLabel>
              <Input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Password" />
            </FormControl>
            <Button type="submit" colorScheme="orange" size="lg" mt={4} isLoading={loading} w="full" bgGradient="linear(to-r, blue.600, orange.400, purple.600)" _hover={{ filter: 'brightness(1.1)' }}>
              Login
            </Button>
          </VStack>
        </form>
        <Text mt={6} fontSize="sm" color="gray.600">
          Don&apos;t have an account?{' '}
          <a href="/signup" style={{ color: '#F59E42', fontWeight: 600, textDecoration: 'underline' }}>Sign up</a>
        </Text>
      </Box>
    </Box>
  );
};

export default Login; 