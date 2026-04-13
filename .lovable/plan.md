

# Fix: "Finalizando..." Stuck Forever

## Root Cause
Race condition in `StepGeneration.tsx`. The animation's `setTimeout` closure captures a stale `generationDone=false`. When the animation finishes, it doesn't see the updated value. Setting `animationDone.current=true` (a ref) doesn't trigger re-render, so the second useEffect never re-fires.

## Fix in `src/components/wizard/StepGeneration.tsx`

Use a ref to mirror `generationDone` so the timer closure always reads the latest value:

```typescript
const generationDoneRef = useRef(false);

// Keep ref in sync
useEffect(() => {
  generationDoneRef.current = generationDone;
}, [generationDone]);
```

Then in the animation's advance function (line 41), check `generationDoneRef.current` instead of `generationDone`:

```typescript
if (generationDoneRef.current) {
  setProgress(100);
  onAnimationDone();
} else {
  setCurrentStage(4); // "Finalizando..."
}
```

Also add a force-update mechanism in the second useEffect: when `generationDone` becomes true but animation is already done, immediately complete:

```typescript
useEffect(() => {
  if (generationDone && animationDone.current && !isComplete) {
    setCurrentStage(4);
    setProgress(100);
    onAnimationDone();
  }
}, [generationDone]); // remove isComplete and onAnimationDone from deps to avoid stale issues
```

## Files Changed
- `src/components/wizard/StepGeneration.tsx` — add `generationDoneRef`, fix stale closure

## Result
- Animation completes → checks ref → sees generation is done → immediately redirects
- No more stuck "Finalizando..." screen

