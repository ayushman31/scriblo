const words = [
    "Apple", "Airplane", "Anchor", "Ant", "Balloon", "Banana", "Bat", "Beach", "Bear", "Bed",
    "Bee", "Bell", "Bench", "Bicycle", "Bird", "Book", "Boot", "Bottle", "Box", "Bridge",
    "Broom", "Burger", "Bus", "Button", "Cactus", "Cake", "Camera", "Candle", "Car", "Carrot",
    "Castle", "Cat", "Chair", "Cheese", "Cloud", "Clock", "Clown", "Coat", "Cookie", "Corn",
    "Cow", "Crayon", "Cup", "Dinosaur", "Dog", "Door", "Dragon", "Drum", "Duck", "Egg",
    "Elephant", "Eye", "Fire", "Fish", "Flag", "Flower", "Fork", "Frog", "Ghost", "Giraffe",
    "Glasses", "Globe", "Grapes", "Guitar", "Hammer", "Hat", "Helicopter", "House", "Ice cream", "Igloo",
    "Jar", "Kangaroo", "Key", "Kite", "Ladder", "Lamp", "Leaf", "Lion", "Lollipop", "Magnet",
    "Moon", "Mushroom", "Octopus", "Owl", "Panda", "Pencil", "Penguin", "Phone", "Pig", "Pizza",
    "Plane", "Rainbow", "Rocket", "Shark", "Sheep", "Shoe", "Snake", "Snowman", "Star", "Tree"
  ];

export function getRandomWord() {
    return words[Math.floor(Math.random() * words.length)];
}







