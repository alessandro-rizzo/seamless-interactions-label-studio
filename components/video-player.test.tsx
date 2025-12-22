import { render, screen, fireEvent } from '@testing-library/react';
import { VideoPlayer } from './video-player';

describe('VideoPlayer', () => {
  const defaultProps = {
    src: '/api/video?fileId=V00_S0001_I00000001_P0001&label=improvised&split=dev',
    label: 'Test Video',
  };

  it('should render with label', () => {
    render(<VideoPlayer {...defaultProps} />);
    expect(screen.getByText('Test Video')).toBeInTheDocument();
  });

  it('should render video element with correct source', () => {
    const { container } = render(<VideoPlayer {...defaultProps} />);
    const video = container.querySelector('video') as HTMLVideoElement;
    expect(video).toBeInTheDocument();

    const source = video.querySelector('source');
    expect(source).toHaveAttribute('src', defaultProps.src);
    expect(source).toHaveAttribute('type', 'video/mp4');
  });

  it('should call onReady callback when video element is ready', () => {
    const onReady = jest.fn();
    render(<VideoPlayer {...defaultProps} onReady={onReady} />);
    expect(onReady).toHaveBeenCalledWith(expect.any(HTMLVideoElement));
  });

  it('should display error message when video fails to load', () => {
    const { container } = render(<VideoPlayer {...defaultProps} />);
    const video = container.querySelector('video') as HTMLVideoElement;

    fireEvent.error(video);

    expect(screen.getByText(/Video not found/)).toBeInTheDocument();
    expect(screen.getByText(defaultProps.src)).toBeInTheDocument();
  });

  it('should hide video element when error occurs', () => {
    const { container } = render(<VideoPlayer {...defaultProps} />);
    const video = container.querySelector('video') as HTMLVideoElement;

    fireEvent.error(video);

    expect(container.querySelector('video')).not.toBeInTheDocument();
  });
});
