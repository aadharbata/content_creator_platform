// test-profanity.ts
import Filter from 'bad-words';

// Test the profanity filter functionality
const filter = new Filter();

// Test messages
const testMessages = [
  "Hello everyone!",
  "This is a damn good stream!",
  "What the hell is going on?",
  "Great content, keep it up!",
  "This shit is amazing",
  "Nice stream, thanks for sharing",
  "F*** this is cool"
];

console.log("Testing profanity filter:");
console.log("========================");

testMessages.forEach((message, index) => {
  const isProfane = filter.isProfane(message);
  const cleaned = filter.clean(message);
  
  console.log(`\nTest ${index + 1}:`);
  console.log(`Original: "${message}"`);
  console.log(`Has profanity: ${isProfane}`);
  console.log(`Cleaned: "${cleaned}"`);
  console.log(`Filtered: ${message !== cleaned}`);
});

// Test custom word filtering
console.log("\n\nTesting custom words:");
console.log("=====================");

// Add a custom word
filter.addWords('badword');

const customTestMessage = "This is a badword test";
console.log(`\nCustom test:`);
console.log(`Original: "${customTestMessage}"`);
console.log(`Has profanity: ${filter.isProfane(customTestMessage)}`);
console.log(`Cleaned: "${filter.clean(customTestMessage)}"`);

// Remove the custom word
filter.removeWords('badword');
console.log(`\nAfter removing custom word:`);
console.log(`Has profanity: ${filter.isProfane(customTestMessage)}`);
console.log(`Cleaned: "${filter.clean(customTestMessage)}"`);
