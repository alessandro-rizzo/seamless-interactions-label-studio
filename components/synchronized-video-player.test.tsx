import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SynchronizedVideoPlayer, SynchronizedVideoPlayerRef } from './synchronized-video-player';
import { createRef } from 'react';

describe('SynchronizedVideoPlayer', () => {
  const defaultProps = {
    video1Src: '/path/to/video1.mp4',
    video2Src: '/path/to/video2.mp4',
    participant1Label: 'Participant 1',
    participant2Label: 'Participant 2',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render both video players with labels', () => {
    render(<SynchronizedVideoPlayer {...defaultProps} />);

    expect(screen.getByText('Participant 1')).toBeInTheDocument();
    expect(screen.getByText('Participant 2')).toBeInTheDocument();
  });

  it('should render play button initially', () => {
    render(<SynchronizedVideoPlayer {...defaultProps} />);

    const playButton = screen.getByRole('button', { name: /play/i });
    expect(playButton).toBeInTheDocument();
  });

  it('should toggle play/pause when button is clicked', async () => {
    render(<SynchronizedVideoPlayer {...defaultProps} />);

    const playButton = screen.getByRole('button', { name: /play/i });

    // Click to play
    await act(async () => {
      fireEvent.click(playButton);
    });

    // Button should now show pause
    expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();

    // Click to pause
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /pause/i }));
    });

    // Button should now show play again
    expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument();
  });

  it('should call onFirstPlay callback on first play only', async () => {
    const onFirstPlay = jest.fn();
    render(<SynchronizedVideoPlayer {...defaultProps} onFirstPlay={onFirstPlay} />);

    const playButton = screen.getByRole('button', { name: /play/i });

    // First play
    await act(async () => {
      fireEvent.click(playButton);
    });
    expect(onFirstPlay).toHaveBeenCalledTimes(1);

    // Pause
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /pause/i }));
    });

    // Second play - should not call onFirstPlay again
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /play/i }));
    });
    expect(onFirstPlay).toHaveBeenCalledTimes(1);
  });

  it('should render time display and seek bar', () => {
    render(<SynchronizedVideoPlayer {...defaultProps} />);

    // Should show initial time 0:00
    expect(screen.getAllByText('0:00')).toHaveLength(2);

    // Should have a range input for seeking
    const seekBar = screen.getByRole('slider');
    expect(seekBar).toBeInTheDocument();
  });

  it('should toggle play/pause with spacebar', async () => {
    render(<SynchronizedVideoPlayer {...defaultProps} />);

    // Initial state is play button visible
    expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument();

    // Press spacebar
    await act(async () => {
      fireEvent.keyDown(window, { code: 'Space' });
    });

    // Should now show pause button
    expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();

    // Press spacebar again
    await act(async () => {
      fireEvent.keyDown(window, { code: 'Space' });
    });

    // Should now show play button
    expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument();
  });

  it('should not toggle play/pause with spacebar when typing in input', async () => {
    render(
      <div>
        <SynchronizedVideoPlayer {...defaultProps} />
        <input type="text" data-testid="test-input" />
      </div>
    );

    const input = screen.getByTestId('test-input');

    // Focus on input and press spacebar
    await act(async () => {
      input.focus();
      fireEvent.keyDown(input, { code: 'Space' });
    });

    // Should still show play button (not toggled)
    expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument();
  });

  it('should expose stop method via ref', async () => {
    const ref = createRef<SynchronizedVideoPlayerRef>();
    render(<SynchronizedVideoPlayer {...defaultProps} ref={ref} />);

    // Start playing
    const playButton = screen.getByRole('button', { name: /play/i });
    await act(async () => {
      fireEvent.click(playButton);
    });

    expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();

    // Call stop via ref
    await act(async () => {
      ref.current?.stop();
    });

    // Should now show play button
    expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument();
  });

  it('should have seek bar with initial value of 0', () => {
    render(<SynchronizedVideoPlayer {...defaultProps} />);

    const seekBar = screen.getByRole('slider');
    expect(seekBar).toHaveValue('0');
  });
});
