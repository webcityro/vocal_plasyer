<template>
	<div class="video-player">
		<video
			ref="videoRef"
			class="video-element"
			@loadedmetadata="onVideoLoaded"
			@timeupdate="onTimeUpdate"
			@error="onVideoError"
			@play="onPlay"
			@pause="onPause"
		></video>
		<div class="file-selection-overlay" v-if="!isPlayerReady">
			<div class="file-selection-content">
				<div class="file-selection-icon">
					<i class="fas fa-film fa-4x"></i>
				</div>
				<h2 class="file-selection-title">Vocal Player</h2>
				<p class="file-selection-description">Creat de către Andrei Vălcu pentru cei care nu pot sau nu vor să citească subtitrarea.</p>

				<div class="file-selection-buttons">
					<button v-if="!selectedVideoPath" class="file-btn primary" @click="selectVideoFile">
						<i class="fas fa-file-video"></i>
						Selectează fișierul video
					</button>

					<template v-else-if="subtitlesEnabled">
						<button class="file-btn secondary" @click="selectSubtitleFile">
							<i class="fas fa-closed-captioning"></i>
							Selectează fișierul de subtitrare
						</button>
						<button class="file-btn secondary" @click="subtitlesEnabled = false">
							<i class="fas fa-eye-slash"></i>
							Fără subtitrare
						</button>
					</template>
				</div>
			</div>
		</div>

		<div class="video-overlay" v-if="isPlayerReady && !isPlaying" @click="play">
			<div class="play-button">
				<i class="fas fa-play fa-2x"></i>
			</div>
		</div>

		<div class="video-controls" v-if="isPlayerReady">
			<div class="progress-container">
				<div class="progress-bar" @click="seek">
					<div class="progress-filled" :style="{ width: progressPercentage + '%' }"></div>
				</div>
				<div class="time-display">
					<span>{{ formatTime(currentTime) }}</span>
					<span>/</span>
					<span>{{ formatTime(duration) }}</span>
				</div>
			</div>

			<div class="controls-main">
				<div class="controls-left">
					<button class="control-btn" @click="togglePlayPause">
						<i v-if="isPlaying" class="fas fa-pause"></i>
						<i v-else class="fas fa-play"></i>
					</button>

					<button class="control-btn" @click="rewind">
						<i class="fas fa-undo-alt"></i>
					</button>

					<button class="control-btn" @click="fastForward">
						<i class="fas fa-redo-alt"></i>
					</button>
				</div>

				<div class="controls-right">
					<button class="control-btn subtitle-btn" :class="{ 'enabled': subtitlesEnabled, 'disabled': !subtitlesEnabled }" @click="toggleSubtitles" v-if="selectedSubtitlePath">
						<i class="fas fa-closed-captioning"></i>
					</button>

					<div class="volume-slider">
						<input
							type="range"
							v-model="volume"
							min="0"
							max="100"
							class="volume-range"
							@input="updateVolume"
						>
					</div>
					<button class="control-btn" @click="toggleMute">
						<i :class="['fas', {
							'fa-volume-mute': videoRef.muted,
							'fa-volume-down': videoRef.volume > 0 && videoRef.volume < 1,
							'fa-volume-up': videoRef.volume === 1
						}]"></i>
					</button>

					<button class="control-btn" @click="toggleFullscreen">
						<i class="fas fa-expand"></i>
					</button>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>
import {computed, onMounted, ref} from 'vue'

const videoRef = ref(null)

const selectedVideoPath = ref(null)
const selectedSubtitlePath = ref(null)
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const volume = ref(100)
const subtitlesEnabled = ref(true)

onMounted(() => {
	if (videoRef.value) {
		videoRef.value.volume = volume.value / 100;
	}
});

const isPlayerReady = computed(() => selectedVideoPath.value !== null && (selectedSubtitlePath.value !== null || !subtitlesEnabled.value));
const progressPercentage = computed(() => duration.value > 0 ? (currentTime.value / duration.value) * 100 : 0)

const formatTime = (seconds) => {
	const mins = Math.floor(seconds / 60);
	const secs = Math.floor(seconds % 60);
	return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const selectVideoFile = async () => {
	try {
		const result = await window.electronAPI.showOpenDialog({
			title: 'Select Video File',
			filters: [
				{name: 'Video Files', extensions: ['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm', 'm4v']},
				{name: 'All Files', extensions: ['*']}
			],
			properties: ['openFile']
		});

		if (!result.canceled && result.filePaths.length > 0) {
			await handleVideoFileSelected(result.filePaths[0]);
		}
	} catch (error) {
		console.error('Error selecting video file:', error);
	}
};

const selectSubtitleFile = async () => {
	try {
		const result = await window.electronAPI.showOpenDialog({
			title: 'Select Subtitle File',
			filters: [
				{name: 'Subtitle Files', extensions: ['srt', 'vtt', 'ass', 'ssa', 'sub']},
				{name: 'All Files', extensions: ['*']}
			],
			properties: ['openFile']
		});

		if (!result.canceled && result.filePaths.length > 0) {
			await handleSubtitleFileSelected(result.filePaths[0]);
		}
	} catch (error) {
		console.error('Error selecting subtitle file:', error);
	}
};

const handleVideoFileSelected = async (filePath) => {
	selectedVideoPath.value = filePath;
	await loadVideo(filePath);
};

const handleSubtitleFileSelected = async (filePath) => {
	selectedSubtitlePath.value = filePath;
	await loadSubtitle(filePath);
};

const loadVideo = async (filePath) => {
	try {
		console.log('Loading video:', filePath);
		const videoUrl = await window.electronAPI.loadVideoFile(filePath);
		console.log('Received video URL:', videoUrl);
		if (videoRef.value) {
			videoRef.value.src = videoUrl;
			console.log('Set video src to:', videoUrl);
		}
	} catch (error) {
		console.error('Error loading video:', error);
	}
};

const loadSubtitle = async (filePath) => {
	try {
		console.log('Loading subtitle:', filePath);
		const subtitleUrl = await window.electronAPI.loadSubtitleFile(filePath);
		console.log('Received subtitle URL:', subtitleUrl);

		if (videoRef.value) {
			videoRef.value.querySelectorAll('track').forEach(track => track.remove());

			const track = document.createElement('track')
			track.kind = 'subtitles';
			track.src = subtitleUrl;

			let srclang = 'ro';
			let label = 'Romanian';

			track.srclang = srclang;
			track.label = label;
			track.default = true;

			videoRef.value.appendChild(track);
			console.log('Subtitle track added:', { srclang, label, src: subtitleUrl });

			setTimeout(() => {
				if (videoRef.value && videoRef.value.textTracks.length > 0) {
					const textTrack = videoRef.value.textTracks[0];
					console.log('Text track found:', textTrack);
					textTrack.mode = 'showing';
					subtitlesEnabled.value = true;
					console.log('Subtitles enabled, mode:', textTrack.mode);

					textTrack.oncuechange = onCueChange;
				} else {
					console.warn('No text tracks found after adding subtitle');
				}
			}, 100);
		}
	} catch (error) {
		console.error('Error loading subtitle:', error);
	}
};

const play = () => {
	videoRef.value?.play();
};

const pause = () => {
	videoRef.value?.pause();
};

const togglePlayPause = () => {
	if (isPlaying.value) {
		pause();
	} else {
		play();
	}
};

const rewind = () => {
	if (videoRef.value) {
		videoRef.value.currentTime = Math.max(0, videoRef.value.currentTime - 10);
	}
};

const fastForward = () => {
	if (videoRef.value) {
		videoRef.value.currentTime = Math.min(videoRef.value.duration, videoRef.value.currentTime + 10)
	}
};

const seek = ({ clientX, currentTarget }) => {
	if (videoRef.value) {
		const { left, width } = currentTarget.getBoundingClientRect();
		videoRef.value.currentTime = ((clientX - left) / width) * videoRef.value.duration;
	}
};

const toggleMute = () => {
	if (videoRef.value) {
		videoRef.value.muted = !videoRef.value.muted;
	}
}

const updateVolume = () => {
	if (videoRef.value) {
		videoRef.value.volume = volume.value / 100;
	}
};

const toggleSubtitles = () => {
	if (videoRef.value && videoRef.value.textTracks.length > 0) {
		const track = videoRef.value.textTracks[0];

		if (track.mode === 'showing') {
			track.mode = 'hidden';
			subtitlesEnabled.value = false;
		} else {
			track.mode = 'showing';
			subtitlesEnabled.value = true;
		}
		console.log('Subtitle toggle - mode:', track.mode, 'enabled:', subtitlesEnabled.value);
	} else {
		console.warn('No text tracks available for toggle');
	}
};

const toggleFullscreen = () => {
	if (videoRef.value) {
		if (document.fullscreenElement) {
			document.exitFullscreen();
		} else {
			videoRef.value.requestFullscreen();
		}
	}
};

// Video event handlers
const onVideoLoaded = () => {
	console.log('Video metadata loaded');
	if (videoRef.value) {
		duration.value = videoRef.value.duration;
		console.log('Video duration:', duration.value);
		console.log('Text tracks available:', videoRef.value.textTracks.length);

		if (selectedSubtitlePath.value && videoRef.value.textTracks.length === 0) {
			console.log('Video loaded but no text tracks found, reloading subtitle...');
			loadSubtitle(selectedSubtitlePath.value);
		}
	}
};

const onTimeUpdate = () => {
	if (videoRef.value) {
		currentTime.value = videoRef.value.currentTime;
	}
};

const onVideoError = (e) => {
	console.error('Video error:', e);
	console.error('Video error details:', {
		error: e.target.error,
		networkState: e.target.networkState,
		readyState: e.target.readyState,
		src: e.target.src
	});
	// No longer set state.isPlayerReady, as isPlayerReady is now a computed property
};

const onPlay = () => {
	isPlaying.value = true;
};

const onPause = () => {
	isPlaying.value = false;
};

const speakSubtitle = (text) => {
	const synth = window.speechSynthesis;
	const voices = synth.getVoices();
	let roVoice = voices.find(v => v.lang.startsWith('ro'));
	const utterance = new window.SpeechSynthesisUtterance(text);

	if (roVoice) {
		utterance.voice = roVoice;
		utterance.lang = roVoice.lang;
	} else {
		utterance.lang = 'ro-RO';
	}

	synth.cancel();
	synth.speak(utterance);
};

const onCueChange = event => {
	const track = event.target;
	const activeCues = track.activeCues;

	if (activeCues && activeCues.length > 0) {
		speakSubtitle(Array.from(activeCues).map(cue => cue.text).join(' '));
	}
};
</script>

<style scoped>
.subtitle-btn {
	transition: opacity 0.2s ease;
}

.subtitle-btn.disabled {
	opacity: 0.5;
}

.subtitle-btn.enabled {
	opacity: 1;
}
</style>
