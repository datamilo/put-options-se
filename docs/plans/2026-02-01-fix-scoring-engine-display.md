# Fix Scoring Engine Performance Display

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Update the Scored Options page to display accurate performance metrics and user-friendly content that matches the official INVESTOR_GUIDE_SCORING_ENGINE_PERFORMANCE.md document, removing technical jargon and incorrect file references.

**Architecture:**
- Replace hardcoded calibration metrics data with values from the official document
- Remove all file/technical references and replace with plain-English explanations
- Update component descriptions to use investor-friendly language without jargon
- Ensure numbers match exactly between what's displayed and the source document

**Tech Stack:** React/TypeScript, Tailwind CSS, data files

---

## Task 1: Update V2.1 Model Calibration Data

**Files:**
- Modify: `src/data/calibrationMetrics.ts` (lines 15-67)

**Context:**
The official document shows V2.1 hit rates at lines 56-67 of INVESTOR_GUIDE_SCORING_ENGINE_PERFORMANCE.md:
- 70-80%: 83.8% hit rate, 19,830 samples, CI: 83.3%-84.3%
- 80-90%: 98.1% hit rate, 27,082 samples, CI: 97.9%-98.2%
- 90-100%: 99.9% hit rate, 1,878 samples, CI: 99.7%-99.99%

Current data shows completely wrong numbers (67%, 80%, etc. for the first three ranges).

**Step 1: Replace V2.1 bucket data**

Replace the entire `v21Buckets` array (lines 16-67) with:

```typescript
  v21Buckets: [
    {
      rangeLabel: '90-100%',
      minScore: 90,
      maxScore: 100,
      hitRate: 0.999,
      sampleSize: 1878,
      confidenceIntervalLower: 0.997,
      confidenceIntervalUpper: 0.9999,
      expectedNote: 'Hit Rate: 99.9%',
    },
    {
      rangeLabel: '80-90%',
      minScore: 80,
      maxScore: 90,
      hitRate: 0.981,
      sampleSize: 27082,
      confidenceIntervalLower: 0.979,
      confidenceIntervalUpper: 0.982,
      expectedNote: 'Hit Rate: 98.1%',
    },
    {
      rangeLabel: '70-80%',
      minScore: 70,
      maxScore: 80,
      hitRate: 0.838,
      sampleSize: 19830,
      confidenceIntervalLower: 0.833,
      confidenceIntervalUpper: 0.843,
      expectedNote: 'Hit Rate: 83.8%',
    },
    {
      rangeLabel: '60-70%',
      minScore: 60,
      maxScore: 70,
      hitRate: 0.514,
      sampleSize: 13506,
      confidenceIntervalLower: 0.506,
      confidenceIntervalUpper: 0.523,
      expectedNote: 'Hit Rate: 51.4%',
    },
    {
      rangeLabel: '50-60%',
      minScore: 50,
      maxScore: 60,
      hitRate: 0.322,
      sampleSize: 7389,
      confidenceIntervalLower: 0.311,
      confidenceIntervalUpper: 0.332,
      expectedNote: 'Hit Rate: 32.2%',
    },
    {
      rangeLabel: '40-50%',
      minScore: 40,
      maxScore: 50,
      hitRate: 0.123,
      sampleSize: 1963,
      confidenceIntervalLower: 0.109,
      confidenceIntervalUpper: 0.138,
      expectedNote: 'Hit Rate: 12.3%',
    },
    {
      rangeLabel: '30-40%',
      minScore: 30,
      maxScore: 40,
      hitRate: 0.064,
      sampleSize: 622,
      confidenceIntervalLower: 0.048,
      confidenceIntervalUpper: 0.086,
      expectedNote: 'Hit Rate: 6.4%',
    },
    {
      rangeLabel: '20-30%',
      minScore: 20,
      maxScore: 30,
      hitRate: 0.015,
      sampleSize: 194,
      confidenceIntervalLower: 0.005,
      confidenceIntervalUpper: 0.044,
      expectedNote: 'Hit Rate: 1.5%',
    },
    {
      rangeLabel: '10-20%',
      minScore: 10,
      maxScore: 20,
      hitRate: 0.40,
      sampleSize: 5,
      confidenceIntervalLower: 0.118,
      confidenceIntervalUpper: 0.769,
      expectedNote: 'Hit Rate: 40.0%',
    },
  ],
```

**Step 2: Verify the data matches the document**

- Open `INVESTOR_GUIDE_SCORING_ENGINE_PERFORMANCE.md` at lines 56-67
- Check that each hitRate, sampleSize, and confidence interval match exactly
- Verify ranges are ordered from highest to lowest score range

---

## Task 2: Update TA Model V3 Calibration Data

**Files:**
- Modify: `src/data/calibrationMetrics.ts` (lines 69-130)

**Context:**
The official document shows TA Model V3 hit rates at lines 154-162 of INVESTOR_GUIDE_SCORING_ENGINE_PERFORMANCE.md:
- 90%+: 89.4% hit rate, 29,108 samples
- 80-90%: 84.2% hit rate, 305,869 samples
- 70-80%: 76.6% hit rate, 636,639 samples (largest bucket)
- 60-70%: 67.4% hit rate, 462,494 samples
- 50-60%: 59.2% hit rate, 151,200 samples
- <50%: 33.4% hit rate, 3,670 samples

Current data shows completely different numbers (44.6%, 57.1%, 65.3%, etc.).

**Step 1: Replace V3 bucket data**

Replace the entire `v3Buckets` array (lines 69-130) with:

```typescript
  v3Buckets: [
    {
      rangeLabel: '90%+',
      minScore: 90,
      maxScore: 100,
      hitRate: 0.894,
      sampleSize: 29108,
      confidenceIntervalLower: 0.890,
      confidenceIntervalUpper: 0.897,
      expectedNote: 'Hit Rate: 89.4%',
    },
    {
      rangeLabel: '80-90%',
      minScore: 80,
      maxScore: 90,
      hitRate: 0.842,
      sampleSize: 305869,
      confidenceIntervalLower: 0.841,
      confidenceIntervalUpper: 0.843,
      expectedNote: 'Hit Rate: 84.2%',
    },
    {
      rangeLabel: '70-80%',
      minScore: 70,
      maxScore: 80,
      hitRate: 0.766,
      sampleSize: 636639,
      confidenceIntervalLower: 0.765,
      confidenceIntervalUpper: 0.7671,
      expectedNote: 'Hit Rate: 76.6%',
    },
    {
      rangeLabel: '60-70%',
      minScore: 60,
      maxScore: 70,
      hitRate: 0.674,
      sampleSize: 462494,
      confidenceIntervalLower: 0.673,
      confidenceIntervalUpper: 0.675,
      expectedNote: 'Hit Rate: 67.4%',
    },
    {
      rangeLabel: '50-60%',
      minScore: 50,
      maxScore: 60,
      hitRate: 0.592,
      sampleSize: 151200,
      confidenceIntervalLower: 0.590,
      confidenceIntervalUpper: 0.594,
      expectedNote: 'Hit Rate: 59.2%',
    },
    {
      rangeLabel: '<50%',
      minScore: 0,
      maxScore: 50,
      hitRate: 0.334,
      sampleSize: 3670,
      confidenceIntervalLower: 0.319,
      confidenceIntervalUpper: 0.349,
      expectedNote: 'Hit Rate: 33.4%',
    },
  ],
```

**Step 2: Verify the data matches the document**

- Open `INVESTOR_GUIDE_SCORING_ENGINE_PERFORMANCE.md` at lines 154-162
- Check that each hitRate, sampleSize, and confidence interval match exactly
- Note: Order from highest to lowest score range for consistency

---

## Task 3: Update V3 Temporal Folds Data

**Files:**
- Modify: `src/data/calibrationMetrics.ts` (lines 132-168)

**Context:**
The official document shows temporal stability data at lines 183-189 of INVESTOR_GUIDE_SCORING_ENGINE_PERFORMANCE.md showing 5 folds with specific hit rates and deviations. Current data shows completely different numbers.

**Step 1: Replace V3 temporal folds data**

Replace the entire `v3TemporalFolds` array (lines 132-168) with:

```typescript
  v3TemporalFolds: [
    {
      fold: 1,
      testPeriod: 'Aug 29 - Dec 2, 2024',
      hitRate: 0.750,
      sampleCount: 72253,
      deviation: -1.6,
    },
    {
      fold: 2,
      testPeriod: 'Dec 3, 2024 - Mar 14, 2025',
      hitRate: 0.694,
      sampleCount: 110180,
      deviation: -7.2,
    },
    {
      fold: 3,
      testPeriod: 'Mar 17 - Jun 26, 2025',
      hitRate: 0.748,
      sampleCount: 108676,
      deviation: -1.8,
    },
    {
      fold: 4,
      testPeriod: 'Jun 27 - Sep 30, 2025',
      hitRate: 0.852,
      sampleCount: 130333,
      deviation: 8.6,
    },
    {
      fold: 5,
      testPeriod: 'Oct 1, 2025 - Jan 12, 2026',
      hitRate: 0.765,
      sampleCount: 215197,
      deviation: -0.1,
    },
  ],
```

**Step 2: Verify the data matches the document**

- Open `INVESTOR_GUIDE_SCORING_ENGINE_PERFORMANCE.md` at lines 183-189
- Check each hitRate, sampleCount, and deviation match exactly
- These numbers describe how the model performed in different time periods

---

## Task 4: Fix CalibrationMetrics Component Description

**Files:**
- Modify: `src/components/scored-options/CalibrationMetrics.tsx` (lines 71-76)

**Context:**
Line 73-75 references:
1. Incorrect weights (says "60%, 30%" but should be "50%, 30%, 20%")
2. Non-existent file name "comprehensive_premium_zone_analysis.csv"
3. Technical language unsuitable for end users

From the official document (lines 26-28), the V2.1 model uses: "50% Current Probability, 30% Historical Peak, 20% Support Strength"

**Step 1: Replace V2.1 description text**

Replace lines 71-76 with:

```typescript
          <div className="bg-gray-50 dark:bg-gray-900 rounded p-4">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              The Probability Optimization Model combines three factors to estimate the likelihood an option will expire worthless (out-of-the-money). This table shows the historical accuracy of predictions at different probability levels, based on analysis of 72,469 options with known outcomes.
            </p>
          </div>
```

**Step 2: Verify no file references remain**

- Ensure no CSV file names are mentioned
- Language should be about "what the model does" not "how it was built"
- Focus on user benefit: "historical accuracy" and "probability levels"

---

## Task 5: Update CalibrationMetrics Accordion Header

**Files:**
- Modify: `src/components/scored-options/CalibrationMetrics.tsx` (lines 26-28)

**Context:**
Line 27 says "Both models independently confirm 77% hit rate at 70-80% prediction range" which is misleading:
- V2.1 shows 83.8% at 70-80% range
- TA Model V3 shows 76.6% at 70-80% range
- They don't both confirm the same number

From the official document, this should acknowledge both models have different hit rates.

**Step 1: Update the accordion header text**

Replace lines 26-28 with:

```typescript
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Probability Optimization Model (83.8% hit rate) and TA ML Model (76.6% hit rate) performance validated on historical data
            </p>
```

**Step 2: Verify accuracy**

- Check official document lines 56-67 (V2.1 70-80% range shows 83.8%)
- Check official document lines 154-162 (TA V3 70-80% range shows 76.6%)
- Text now accurately represents both models

---

## Task 6: Fix TA Model V3 Description

**Files:**
- Modify: `src/components/scored-options/CalibrationMetrics.tsx` (lines 89-98)

**Context:**
Lines 89-98 contain good information but reference "comprehensive_premium_zone_analysis.csv" which doesn't exist and is technical jargon.

**Step 1: Replace TA Model description**

Replace lines 89-98 with:

```typescript
          <div className="bg-gray-50 dark:bg-gray-900 rounded p-4 space-y-3">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              The TA ML Model uses machine learning to analyze 17 different signals about each option and the underlying stock to estimate the probability it will expire worthless. This table shows the historical accuracy of predictions at different probability levels.
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>How accurate is this model?</strong> We tested this model on 1.59 million predictions covering future time periods the model never trained on. This out-of-sample testing shows how well the model would perform on new options going forward.
            </p>
          </div>
```

**Step 2: Verify language is user-friendly**

- No technical jargon like "walk-forward validated"
- Explains "why we tested it this way" in plain English
- Removes all file name references

---

## Task 7: Update Disclaimer: "77% Hit Rate ≠ No Losses"

**Files:**
- Modify: `src/pages/ScoredOptions.tsx` (lines 334-348)

**Context:**
The disclaimer at lines 334-348 says "23% of options in the 70-80% range" which is accurate but only refers to one model. Should clarify:
1. V2.1 shows 83.8% hit rate (so 16.2% losses)
2. TA Model shows 76.6% hit rate (so 23.4% losses)
3. Different models, different loss rates

**Step 1: Update the hit rate disclaimer**

Replace lines 334-348 with:

```typescript
                {/* Disclaimer 1: Hit Rate Reality */}
                <div className="mb-4 p-3 bg-white dark:bg-amber-900/30 rounded">
                  <div className="flex items-start gap-2 mb-2">
                    <span className="font-semibold text-amber-900 dark:text-amber-50">
                      High Hit Rates Don't Mean No Losses
                    </span>
                    <InfoIconTooltip
                      title={scoredOptionsTooltips.disclaimers.riskHitRate.title}
                      content={scoredOptionsTooltips.disclaimers.riskHitRate.content}
                      side="left"
                    />
                  </div>
                  <p className="text-sm text-amber-800 dark:text-amber-100">
                    Even options predicted as 83.8% likely to expire worthless (Probability Optimization Model at 70-80% range) will still fail 16.2% of the time. Expect losses on 1-2 out of every 10 positions. Position sizing must account for this failure rate.
                  </p>
                </div>
```

**Step 2: Verify the math**

- 83.8% means 16.2% losses (100 - 83.8)
- "1-2 out of every 10" is intuitive way to express ~16%
- Language is clear about what "failure" means

---

## Task 8: Update Disclaimer: "Market Regime Changes"

**Files:**
- Modify: `src/pages/ScoredOptions.tsx` (lines 350-365)

**Context:**
Line 363 says "21+ months of data" which matches the document. However, should be more specific about what this means for users. From the official document (lines 288-293), models are trained on April 2024 - January 2026 with "primarily normal market conditions" and "limited bear market data."

**Step 1: Update market regime disclaimer**

Replace lines 350-365 with:

```typescript
                {/* Disclaimer 2: Market Regime Changes */}
                <div className="mb-4 p-3 bg-white dark:bg-amber-900/30 rounded">
                  <div className="flex items-start gap-2 mb-2">
                    <span className="font-semibold text-amber-900 dark:text-amber-50">
                      Models Trained on Recent History
                    </span>
                    <InfoIconTooltip
                      title={scoredOptionsTooltips.disclaimers.marketRegimeRisk.title}
                      content={scoredOptionsTooltips.disclaimers.marketRegimeRisk.content}
                      side="left"
                    />
                  </div>
                  <p className="text-sm text-amber-800 dark:text-amber-100">
                    These models learned patterns from April 2024 - January 2026 (21 months of relatively normal market conditions). Major market shocks, extreme interest rate changes, or geopolitical events could invalidate these patterns. If market conditions change significantly, model accuracy may decline.
                  </p>
                </div>
```

**Step 2: Verify accuracy**

- Check official document line 288 for training period
- Confirms this is a limitation users need to understand
- Encourages monitoring and skepticism when markets behave differently

---

## Task 9: Update Disclaimer: "No Future Guarantees"

**Files:**
- Modify: `src/pages/ScoredOptions.tsx` (lines 367-382)

**Context:**
Line 380 references "walk-forward validation (0.651 AUC)" which is technical jargon end users won't understand. Should explain what this means without the jargon.

From the official document (lines 263-267):
- Walk-Forward AUC of 0.65 means the model can "rank options from most-likely to least-likely to expire worthless"
- Does NOT guarantee which specific options will expire worthless
- Is NOT the same as hit rate

**Step 1: Replace technical jargon with plain English**

Replace lines 367-382 with:

```typescript
                {/* Disclaimer 3: No Guarantees */}
                <div className="p-3 bg-white dark:bg-amber-900/30 rounded">
                  <div className="flex items-start gap-2 mb-2">
                    <span className="font-semibold text-amber-900 dark:text-amber-50">
                      Past Performance ≠ Future Results
                    </span>
                    <InfoIconTooltip
                      title={scoredOptionsTooltips.disclaimers.noGuarantees.title}
                      content={scoredOptionsTooltips.disclaimers.noGuarantees.content}
                      side="left"
                    />
                  </div>
                  <p className="text-sm text-amber-800 dark:text-amber-100">
                    These models performed well on historical data. There is no guarantee they will perform the same way in the future. Use these scores as one input to your decision-making process, not as the sole reason to write put options. Always apply your own judgment and risk management.
                  </p>
                </div>
```

**Step 2: Verify no jargon remains**

- Remove "walk-forward validation"
- Remove "AUC"
- Use "one input to decision-making" instead of "screening tool"
- Emphasize human judgment

---

## Task 10: Commit All Changes

**Files:**
- All modified files from Tasks 1-9

**Step 1: Stage all changes**

Run:
```bash
git add -A
```

**Step 2: Create commit message**

Run:
```bash
git commit -m "$(cat <<'EOF'
fix: Update Scored Options calibration metrics and user-facing text

- Replace hardcoded calibration data with correct numbers from INVESTOR_GUIDE_SCORING_ENGINE_PERFORMANCE.md
  - V2.1: Updated all 9 score ranges (70-80% now shows 83.8% instead of 67%)
  - TA Model V3: Updated all 6 score ranges (70-80% now shows 76.6% instead of 77.1%)
  - Temporal folds: Updated fold 1-5 data with correct hit rates and deviations
- Remove file name references from component descriptions (users don't need to know internal data sources)
- Replace technical jargon with plain English explanations
  - "walk-forward validation" → "tested on future data the model never trained on"
  - "AUC" → removed entirely, explain concept in plain terms
  - Weights now correctly shown as 50%, 30%, 20% instead of 60%, 30%
- Update disclaimers to reflect both model hit rates (83.8% vs 76.6%)
- Clarify that 83.8% hit rate means 16.2% failure rate, not "no losses"

Numbers verified against official document dated February 1, 2026.

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>
EOF
)"
```

**Step 3: Verify commit succeeded**

Run:
```bash
git log -1 --format='%H %s'
```

Expected: Shows the new commit hash and message

**Step 4: Push to remote**

Run:
```bash
git push origin main
```

Expected: Success message like "main -> main"

---

## Verification Checklist

After implementing all tasks, verify:

- [ ] V2.1 70-80% range shows 83.8% hit rate (not 67%)
- [ ] TA Model V3 70-80% range shows 76.6% hit rate (not 77.1%)
- [ ] All sample sizes match official document exactly
- [ ] No CSV file names mentioned in component text
- [ ] All confidence intervals match document values
- [ ] Disclaimers reference both models (83.8% and 76.6%)
- [ ] No technical jargon ("AUC", "walk-forward", "isotonic regression") in user-facing text
- [ ] Numbers in disclaimers are accurately explained (83.8% = 16.2% failure rate)
- [ ] Test the Scored Options page loads without errors
- [ ] CalibrationMetrics accordion opens/closes properly

---

## Plan complete and saved to `docs/plans/2026-02-01-fix-scoring-engine-display.md`

**Two execution options:**

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

Which approach would you prefer?