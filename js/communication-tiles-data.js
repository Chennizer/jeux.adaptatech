(function attachCommunicationTilesData(global) {
  const baseItems = [
    { id: 'eat', symbol: '🍽️', label: 'eat', sentence: 'eat' },
    { id: 'drink', symbol: '🥤', label: 'drink', sentence: 'drink' },
    { id: 'bathroom', symbol: '🚻', label: 'bathroom', sentence: 'to use the bathroom' },
    { id: 'break', symbol: '🛋️', label: 'break', sentence: 'a break' },
    { id: 'more', symbol: '➕', label: 'more', sentence: 'more' },
    { id: 'stop', symbol: '🛑', label: 'stop', sentence: 'to stop' },
    { id: 'help', symbol: '🆘', label: 'help', sentence: 'help' },
    { id: 'pain', symbol: '🤕', label: 'pain', sentence: 'to talk about pain' },
    { id: 'happy', symbol: '🙂', label: 'happy', sentence: 'happy' },
    { id: 'sad', symbol: '🙁', label: 'sad', sentence: 'sad' }
  ];

  const expandedOnly = [
    { id: 'hot', symbol: '🥵', label: 'hot', sentence: 'hot' },
    { id: 'cold', symbol: '🥶', label: 'cold', sentence: 'cold' },
    { id: 'yes', symbol: '✅', label: 'yes', sentence: 'yes' },
    { id: 'no', symbol: '❌', label: 'no', sentence: 'no' },
    { id: 'finished', symbol: '🏁', label: 'finished', sentence: 'finished' },
    { id: 'music', symbol: '🎵', label: 'music', sentence: 'music' }
  ];

  const starterOptions = [
    { id: 'want', label: 'I want' },
    { id: 'need', label: 'I need' },
    { id: 'feel', label: 'I feel' }
  ];

  global.CommunicationTilesData = {
    vocabSets: {
      basic: baseItems,
      expanded: baseItems.concat(expandedOnly)
    },
    starterOptions
  };
})(window);
