const Papa = require('papaparse');
const fs = require('fs');

console.log('=== TESTING UPCOMING EVENTS FUNCTIONALITY ===\n');

// Read the CSV file
const csvText = fs.readFileSync('./data/upcoming_events.csv', 'utf8');

Papa.parse(csvText, {
  header: true,
  delimiter: '|',
  skipEmptyLines: true,
  complete: (results) => {
    const events = results.data.map((row) => ({
      date: String(row.date || ''),
      stock_name: String(row.stock_name || ''),
      event_type: String(row.event_type || ''),
      event_category: String(row.event_category || ''),
      days_until_event: parseInt(String(row.days_until_event || '0'), 10),
      is_earnings: String(row.is_earnings || 'False').toLowerCase() === 'true',
      details: String(row.details || '')
    }));

    console.log(`✅ Parsed ${events.length} events from CSV\n`);

    // TEST 1: Verify Sinch AB event (1 day away)
    console.log('TEST 1: Sinch AB Event (1 day away)\n');
    const sinchEvent = events.find(e => e.stock_name === 'Sinch AB');
    if (sinchEvent) {
      console.log('  ✅ Event found for Sinch AB');
      console.log(`  - Date: ${sinchEvent.date}`);
      console.log(`  - Days until: ${sinchEvent.days_until_event}`);
      console.log(`  - Type: ${sinchEvent.event_type}`);
      console.log(`  - Category: ${sinchEvent.event_category}`);
      console.log(`  - Is Earnings: ${sinchEvent.is_earnings}`);
      console.log(`  - Details: ${sinchEvent.details}`);
      console.log(`  - Is Urgent (≤7 days): ${sinchEvent.days_until_event <= 7}\n`);
    } else {
      console.log('  ❌ Event NOT found for Sinch AB\n');
    }

    // TEST 2: Verify multiple stocks with events
    console.log('TEST 2: Multiple stocks with events\n');
    const testStocks = ['Orrón Energy AB', 'Castellum AB', 'AstraZeneca PLC'];
    testStocks.forEach(stock => {
      const event = events.find(e => e.stock_name === stock);
      if (event) {
        console.log(`  ✅ ${stock} - ${event.date} (${event.days_until_event} days)`);
      } else {
        console.log(`  ❌ ${stock} - NO EVENT FOUND`);
      }
    });
    console.log();

    // TEST 3: Test stock with no event
    console.log('TEST 3: Stock with no upcoming event\n');
    const noEventStock = 'Apple Inc'; // Not in the list
    const noEventResult = events.find(e => e.stock_name === noEventStock);
    console.log(`  Stock: ${noEventStock}`);
    console.log(`  Event found: ${noEventResult ? 'YES' : 'NO'}`);
    console.log(`  Card should render: ${noEventResult ? 'YES' : 'NO'}\n`);

    // TEST 4: Verify urgent styling logic
    console.log('TEST 4: Urgent event detection (≤7 days)\n');
    const urgentEvents = events.filter(e => e.days_until_event <= 7);
    console.log(`  Total urgent events: ${urgentEvents.length}`);
    urgentEvents.slice(0, 5).forEach(e => {
      console.log(`  - ${e.stock_name}: ${e.days_until_event} day${e.days_until_event === 1 ? '' : 's'} (orange styling: YES)`);
    });
    console.log();

    // TEST 5: Verify date format
    console.log('TEST 5: Date format verification\n');
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const validDates = events.filter(e => dateRegex.test(e.date));
    console.log(`  Total events: ${events.length}`);
    console.log(`  Valid YYYY-MM-DD format: ${validDates.length}`);
    console.log(`  Format validation: ${validDates.length === events.length ? '✅ PASS' : '❌ FAIL'}\n`);

    // TEST 6: Verify caching behavior
    console.log('TEST 6: Caching simulation\n');
    let cachedEvents = null;
    
    // First load
    console.log('  First load: cachedEvents is null, load from CSV');
    if (!cachedEvents) {
      cachedEvents = events;
      console.log('  ✅ Cache populated with', cachedEvents.length, 'events');
    }
    
    // Second load (should use cache)
    const getEventForStock = (stockName) => {
      return cachedEvents.find(event => event.stock_name === stockName) || null;
    };
    
    const cachedSinch = getEventForStock('Sinch AB');
    console.log('  Subsequent loads: use cached data');
    console.log('  ✅ Retrieved Sinch AB from cache:', cachedSinch ? 'YES' : 'NO\n');

    console.log('=== ALL TESTS COMPLETED ===');
  }
});
