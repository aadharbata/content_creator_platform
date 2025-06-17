import React, { useState } from 'react';
import {
  Box, Button, FormControl, FormLabel, Input, Select, VStack, Heading, Text, useToast
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';

const CreatorFanSignUp = () => {
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirm_password: '', role: 'creator',
  });
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm_password) {
      toast({ status: 'error', title: 'Passwords do not match.' });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/creator-fan/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast({ status: 'success', title: 'Sign up successful!' });
        navigate('/login');
      } else {
        toast({ status: 'error', title: data.message || 'Sign up failed.' });
      }
    } catch (err) {
      toast({ status: 'error', title: 'Server error.' });
    }
    setLoading(false);
  };

  return (
    <Box minH="100vh" bgGradient="linear(to-br, blue.900, purple.900, orange.400)" display="flex" alignItems="center" justifyContent="center" px={2} py={8}>
      <Box bg="whiteAlpha.800" boxShadow="2xl" borderRadius="2xl" p={{ base: 8, md: 12 }} maxW="md" w="full" textAlign="center">
        <Box bgGradient="linear(to-tr, blue.500, orange.400, purple.500)" borderRadius="full" w={16} h={16} mx="auto" mb={4} display="flex" alignItems="center" justifyContent="center" boxShadow="xl" border="4px solid white">
          <Text color="white" fontSize="2xl" fontWeight="extrabold" letterSpacing="widest">CP</Text>
        </Box>
        <Heading as="h1" fontSize={{ base: '3xl', md: '4xl' }} fontWeight="black" mb={2} color="blue.900">Sign Up</Heading>
        <Text color="gray.700" mb={6}>Join as a Creator or Fan and start your journey!</Text>
        <form onSubmit={handleSubmit}>
          <VStack spacing={4} align="stretch">
            <FormControl isRequired>
              <FormLabel>Name</FormLabel>
              <Input name="name" value={form.name} onChange={handleChange} placeholder="Your Name" />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Email</FormLabel>
              <Input name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@email.com" />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Password</FormLabel>
              <Input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Password" />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Confirm Password</FormLabel>
              <Input name="confirm_password" type="password" value={form.confirm_password} onChange={handleChange} placeholder="Confirm Password" />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Sign up as</FormLabel>
              <Select name="role" value={form.role} onChange={handleChange}>
                <option value="creator">Creator</option>
                <option value="fan">Fan</option>
              </Select>
            </FormControl>
            <Button type="submit" colorScheme="orange" size="lg" mt={4} isLoading={loading} w="full" bgGradient="linear(to-r, blue.600, orange.400, purple.600)" _hover={{ filter: 'brightness(1.1)' }}>
              Sign Up
            </Button>
          </VStack>
        </form>
        <Text mt={6} fontSize="sm" color="gray.600">
          Are you a brand?{' '}
          <a href="/brand/signup" style={{ color: '#F59E42', fontWeight: 600, textDecoration: 'underline' }}>Sign up as a Brand</a>
        </Text>
      </Box>
    </Box>
  );
};

export default CreatorFanSignUp; 