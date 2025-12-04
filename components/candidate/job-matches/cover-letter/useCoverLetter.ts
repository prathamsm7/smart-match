import { useReducer, useEffect, useCallback } from 'react';
import {
  coverLetterService,
  type CoverLetterData,
} from '@/lib/services/coverLetter.service';

interface UseCoverLetterParams {
  jobId: string;
  resumeId: string;
  jobTitle: string;
  company: string;
  description: string;
  requirements?: any;
  onCoverLetterGenerated: (coverLetterId: string, finalText: string) => void;
}

type LoadingState = 'idle' | 'loading' | 'generating' | 'regenerating';

interface CoverLetterState {
  includeCoverLetter: boolean;
  loadingState: LoadingState;
  editing: boolean;
  coverLetter: CoverLetterData | null;
  editedText: string;
  error: string | null;
}

type CoverLetterAction =
  | { type: 'RESET' }
  | { type: 'SET_INCLUDE'; payload: boolean }
  | { type: 'SET_LOADING'; payload: LoadingState }
  | { type: 'SET_COVER_LETTER'; payload: CoverLetterData }
  | { type: 'SET_EDITED_TEXT'; payload: string }
  | { type: 'SET_EDITING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

function coverLetterReducer(
  state: CoverLetterState,
  action: CoverLetterAction
): CoverLetterState {
  switch (action.type) {
    case 'RESET':
      return {
        includeCoverLetter: false,
        loadingState: 'idle',
        editing: false,
        coverLetter: null,
        editedText: '',
        error: null,
      };
    case 'SET_INCLUDE':
      return { ...state, includeCoverLetter: action.payload };
    case 'SET_LOADING':
      return { ...state, loadingState: action.payload, error: null };
    case 'SET_COVER_LETTER':
      return {
        ...state,
        coverLetter: action.payload,
        editedText: action.payload.finalText || action.payload.generatedText,
        loadingState: 'idle',
      };
    case 'SET_EDITED_TEXT':
      return { ...state, editedText: action.payload };
    case 'SET_EDITING':
      return { ...state, editing: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loadingState: 'idle' };
    default:
      return state;
  }
}

const initialState: CoverLetterState = {
  includeCoverLetter: false,
  loadingState: 'idle',
  editing: false,
  coverLetter: null,
  editedText: '',
  error: null,
};

export function useCoverLetter({
  jobId,
  resumeId,
  jobTitle,
  company,
  description,
  requirements,
  onCoverLetterGenerated,
}: UseCoverLetterParams) {
  const [state, dispatch] = useReducer(coverLetterReducer, initialState);

  // Reset state when jobId changes
  useEffect(() => {
    dispatch({ type: 'RESET' });
  }, [jobId]);

  // Memoize derived values
  const isLoading = state.loadingState === 'loading';
  const isGenerating = state.loadingState === 'generating';
  const isRegenerating = state.loadingState === 'regenerating';

  const handleFetchOrGenerate = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: 'loading' });

      // Try to fetch existing cover letter
      const existing = await coverLetterService.fetchByJobId(jobId);

      if (existing) {
        dispatch({ type: 'SET_COVER_LETTER', payload: existing });
        onCoverLetterGenerated(existing.id, existing.finalText || existing.generatedText);
      } else {
        // Generate new one
        dispatch({ type: 'SET_LOADING', payload: 'generating' });

        const newCoverLetter = await coverLetterService.generate({
          resumeId,
          jobId,
          jobTitle,
          company,
          description,
          requirements,
        });

        dispatch({ type: 'SET_COVER_LETTER', payload: newCoverLetter });
        onCoverLetterGenerated(newCoverLetter.id, newCoverLetter.generatedText);
      }
    } catch (err: any) {
      console.error('Error fetching/generating cover letter:', err);
      dispatch({ type: 'SET_ERROR', payload: err.message || 'Failed to load cover letter' });
    }
  }, [jobId, resumeId, jobTitle, company, description, requirements, onCoverLetterGenerated]);

  const handleCheckboxChange = useCallback(
    async (checked: boolean) => {
      dispatch({ type: 'SET_INCLUDE', payload: checked });

      if (checked && !state.coverLetter && state.loadingState === 'idle') {
        // Fetch or generate
        await handleFetchOrGenerate();
      } else if (checked && state.coverLetter) {
        // Already have it, just notify parent
        onCoverLetterGenerated(
          state.coverLetter.id,
          state.coverLetter.finalText || state.coverLetter.generatedText
        );
      }
    },
    [state.coverLetter, state.loadingState, handleFetchOrGenerate, onCoverLetterGenerated]
  );

  const handleRegenerate = useCallback(async () => {
    if (!state.coverLetter || isRegenerating) return;

    try {
      dispatch({ type: 'SET_LOADING', payload: 'regenerating' });

      const updated = await coverLetterService.regenerate(state.coverLetter.id, {
        resumeId,
        jobTitle,
        company,
        description,
        requirements,
      });

      dispatch({ type: 'SET_COVER_LETTER', payload: updated });
      dispatch({ type: 'SET_EDITING', payload: false });
      onCoverLetterGenerated(updated.id, updated.generatedText);
    } catch (err: any) {
      console.error('Error regenerating cover letter:', err);
      dispatch({ type: 'SET_ERROR', payload: err.message || 'Failed to regenerate cover letter' });
    }
  }, [state.coverLetter, resumeId, jobTitle, company, description, requirements, isRegenerating, onCoverLetterGenerated]);

  const handleSaveEdit = useCallback(async () => {
    if (!state.coverLetter) return;

    try {
      await coverLetterService.update(state.coverLetter.id, state.editedText);
      const updated = {
        ...state.coverLetter,
        finalText: state.editedText,
        isEdited: true,
      };
      dispatch({ type: 'SET_COVER_LETTER', payload: updated });
      dispatch({ type: 'SET_EDITING', payload: false });
      onCoverLetterGenerated(state.coverLetter.id, state.editedText);
    } catch (err: any) {
      console.error('Error saving cover letter:', err);
      dispatch({ type: 'SET_ERROR', payload: err.message || 'Failed to save cover letter' });
    }
  }, [state.coverLetter, state.editedText, onCoverLetterGenerated]);

  const handleCancelEdit = useCallback(() => {
    if (state.coverLetter) {
      dispatch({
        type: 'SET_EDITED_TEXT',
        payload: state.coverLetter.finalText || state.coverLetter.generatedText,
      });
    }
    dispatch({ type: 'SET_EDITING', payload: false });
  }, [state.coverLetter]);

  return {
    includeCoverLetter: state.includeCoverLetter,
    loading: isLoading,
    generating: isGenerating,
    regenerating: isRegenerating,
    editing: state.editing,
    coverLetter: state.coverLetter,
    editedText: state.editedText,
    error: state.error,
    setIncludeCoverLetter: (value: boolean) => dispatch({ type: 'SET_INCLUDE', payload: value }),
    setEditing: (value: boolean) => dispatch({ type: 'SET_EDITING', payload: value }),
    setEditedText: (value: string) => dispatch({ type: 'SET_EDITED_TEXT', payload: value }),
    handleCheckboxChange,
    handleRegenerate,
    handleSaveEdit,
    handleCancelEdit,
  };
}

