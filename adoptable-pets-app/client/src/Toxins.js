import React from 'react';

function Toxins() {
  const commonToxins = [
    'Chocolate',
    'Onions',
    'Garlic',
    'Grapes',
    'Raisins',
    'Alcohol',
    'Caffeine',
  ];

  return (
    <div>
      <h1>Common Pet Toxins</h1>
      <ul>
        {commonToxins.map((toxin, index) => (
          <li key={index}>{toxin}</li>
        ))}
      </ul>
    </div>
  );
}

export default Toxins;
