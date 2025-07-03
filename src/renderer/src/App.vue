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
				<h2 class="file-selection-title">No Video Loaded</h2>
				<p class="file-selection-description">Select a video file to start playing</p>

				<div class="file-selection-buttons">
					<button class="file-btn primary" @click="selectVideoFile">
						<i class="fas fa-file-video"></i>
						Select Video File
					</button>

					<button class="file-btn secondary" @click="selectSubtitleFile">
						<i class="fas fa-closed-captioning"></i>
						Select Subtitle File
					</button>
				</div>
			</div>
		</div>

		<div class="video-overlay" v-if="isPlayerReady && !state.isPlaying" @click="play">
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
					<span>{{ formatTime(state.currentTime) }}</span>
					<span>/</span>
					<span>{{ formatTime(state.duration) }}</span>
				</div>
			</div>

			<div class="controls-main">
				<div class="controls-left">
					<button class="control-btn" @click="togglePlayPause">
						<i v-if="state.isPlaying" class="fas fa-pause"></i>
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
					<button class="control-btn" @click="selectSubtitleFile">
						<i class="fas fa-closed-captioning"></i>
					</button>

					<button class="control-btn subtitle-btn" :class="{ 'enabled': state.subtitlesEnabled, 'disabled': !state.subtitlesEnabled }" @click="toggleSubtitles" v-if="state.selectedSubtitlePath">
						<i class="fas fa-closed-captioning"></i>
					</button>

					<button class="control-btn" @click="checkSubtitles" v-if="state.selectedSubtitlePath">
						<i class="fas fa-bug"></i>
					</button>

					<div class="volume-slider">
						<input
							type="range"
							v-model="state.volume"
							min="0"
							max="100"
							class="volume-range"
							@input="updateVolume"
						>
					</div>

					<button class="control-btn" @click="toggleFullscreen">
						<i class="fas fa-expand"></i>
					</button>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, } from 'vue'

const videoRef = ref(null)

const state = reactive({
	selectedVideoPath: null,
	selectedSubtitlePath: null,
	isPlaying: false,
	isMuted: false,
	currentTime: 0,
	duration: 0,
	volume: 100,
	isPlayerReady: false,
	subtitlesEnabled: true
});

onMounted(() => {
	// Initialize volume
	if (videoRef.value) {
		videoRef.value.volume = state.volume / 100
	}
})

const isPlayerReady = computed(() => {
	return state.selectedVideoPath !== null;
});

const progressPercentage = computed(() => {
	return state.duration > 0 ? (state.currentTime / state.duration) * 100 : 0
})

const formatTime = (seconds) => {
	const mins = Math.floor(seconds / 60)
	const secs = Math.floor(seconds % 60)
	return `${mins}:${secs.toString().padStart(2, '0')}`
}

const selectVideoFile = async () => {
	try {
		const result = await window.electronAPI.showOpenDialog({
			title: 'Select Video File',
			filters: [
				{name: 'Video Files', extensions: ['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm', 'm4v']},
				{name: 'All Files', extensions: ['*']}
			],
			properties: ['openFile']
		})

		if (!result.canceled && result.filePaths.length > 0) {
			handleVideoFileSelected(result.filePaths[0])
		}
	} catch (error) {
		console.error('Error selecting video file:', error)
	}
}

const selectSubtitleFile = async () => {
	try {
		const result = await window.electronAPI.showOpenDialog({
			title: 'Select Subtitle File',
			filters: [
				{name: 'Subtitle Files', extensions: ['srt', 'vtt', 'ass', 'ssa', 'sub']},
				{name: 'All Files', extensions: ['*']}
			],
			properties: ['openFile']
		})

		if (!result.canceled && result.filePaths.length > 0) {
			handleSubtitleFileSelected(result.filePaths[0])
		}
	} catch (error) {
		console.error('Error selecting subtitle file:', error)
	}
}

const handleVideoFileSelected = async (filePath) => {
	state.selectedVideoPath = filePath
	await loadVideo(filePath)
}

const handleSubtitleFileSelected = async (filePath) => {
	state.selectedSubtitlePath = filePath
	await loadSubtitle(filePath)
}

const loadVideo = async (filePath) => {
	try {
		console.log('Loading video:', filePath)
		const videoUrl = await window.electronAPI.loadVideoFile(filePath)
		console.log('Received video URL:', videoUrl)
		if (videoRef.value) {
			videoRef.value.src = videoUrl
			console.log('Set video src to:', videoUrl)
		}
	} catch (error) {
		console.error('Error loading video:', error)
	}
}

const loadSubtitle = async (filePath) => {
	try {
		console.log('Loading subtitle:', filePath)
		const subtitleUrl = await window.electronAPI.loadSubtitleFile(filePath)
		console.log('Received subtitle URL:', subtitleUrl)

		if (videoRef.value) {
			// Remove existing tracks
			const existingTracks = videoRef.value.querySelectorAll('track')
			existingTracks.forEach(track => track.remove())

			// Create track element for subtitle
			const track = document.createElement('track')
			track.kind = 'subtitles'
			track.src = subtitleUrl

			// Determine language and label based on file extension
			// const fileExt = filePath.toLowerCase().split('.').pop()
			let srclang = 'ro'
			let label = 'Romanian'

			/*if (fileExt === 'srt' || fileExt === 'vtt') {
				// Try to detect language from filename
				if (filePath.toLowerCase().includes('ro') || filePath.toLowerCase().includes('romanian')) {
					srclang = 'ro'
					label = 'Romanian'
				} else if (filePath.toLowerCase().includes('es') || filePath.toLowerCase().includes('spanish')) {
					srclang = 'es'
					label = 'Spanish'
				} else if (filePath.toLowerCase().includes('fr') || filePath.toLowerCase().includes('french')) {
					srclang = 'fr'
					label = 'French'
				}
			}*/

			track.srclang = srclang
			track.label = label
			track.default = true

			videoRef.value.appendChild(track)
			console.log('Subtitle track added:', { srclang, label, src: subtitleUrl })

			// Wait a bit for the track to be loaded, then enable subtitles
			setTimeout(() => {
				if (videoRef.value && videoRef.value.textTracks.length > 0) {
					const textTrack = videoRef.value.textTracks[0]
					console.log('Text track found:', textTrack)
					textTrack.mode = 'showing'
					state.subtitlesEnabled = true
					console.log('Subtitles enabled, mode:', textTrack.mode)
				} else {
					console.warn('No text tracks found after adding subtitle')
				}
			}, 100)
		}
	} catch (error) {
		console.error('Error loading subtitle:', error)
	}
}

const play = () => {
	if (videoRef.value) {
		videoRef.value.play()
	}
}

const pause = () => {
	if (videoRef.value) {
		videoRef.value.pause()
	}
}

const togglePlayPause = () => {
	if (state.isPlaying) {
		pause()
	} else {
		play()
	}
}

const rewind = () => {
	if (videoRef.value) {
		videoRef.value.currentTime = Math.max(0, videoRef.value.currentTime - 10)
	}
}

const fastForward = () => {
	if (videoRef.value) {
		videoRef.value.currentTime = Math.min(videoRef.value.duration, videoRef.value.currentTime + 10)
	}
}

const seek = (event) => {
	if (videoRef.value) {
		const rect = event.currentTarget.getBoundingClientRect()
		const clickX = event.clientX - rect.left
		const percentage = clickX / rect.width
		videoRef.value.currentTime = percentage * videoRef.value.duration
	}
}

const toggleMute = () => {
	if (videoRef.value) {
		videoRef.value.muted = !videoRef.value.muted
		state.isMuted = videoRef.value.muted
	}
}

const updateVolume = () => {
	if (videoRef.value) {
		videoRef.value.volume = state.volume / 100
		state.isMuted = state.volume === 0
	}
}

const toggleSubtitles = () => {
	if (videoRef.value && videoRef.value.textTracks.length > 0) {
		const track = videoRef.value.textTracks[0]
		if (track.mode === 'showing') {
			track.mode = 'hidden'
			state.subtitlesEnabled = false
		} else {
			track.mode = 'showing'
			state.subtitlesEnabled = true
		}
		console.log('Subtitle toggle - mode:', track.mode, 'enabled:', state.subtitlesEnabled)
	} else {
		console.warn('No text tracks available for toggle')
	}
}

const checkSubtitles = () => {
	if (videoRef.value) {
		console.log('Checking subtitles...')
		console.log('Text tracks count:', videoRef.value.textTracks.length)
		for (let i = 0; i < videoRef.value.textTracks.length; i++) {
			const track = videoRef.value.textTracks[i]
			console.log(`Track ${i}:`, {
				kind: track.kind,
				label: track.label,
				srclang: track.srclang,
				mode: track.mode,
				readyState: track.readyState
			})
		}
	}
}

const toggleFullscreen = () => {
	if (videoRef.value) {
		if (document.fullscreenElement) {
			document.exitFullscreen()
		} else {
			videoRef.value.requestFullscreen()
		}
	}
}

// Video event handlers
const onVideoLoaded = () => {
	console.log('Video metadata loaded')
	if (videoRef.value) {
		state.duration = videoRef.value.duration
		console.log('Video duration:', state.duration)
		console.log('Text tracks available:', videoRef.value.textTracks.length)

		// If we have a subtitle path but no text tracks, try to load subtitles again
		if (state.selectedSubtitlePath && videoRef.value.textTracks.length === 0) {
			console.log('Video loaded but no text tracks found, reloading subtitle...')
			loadSubtitle(state.selectedSubtitlePath)
		}
	}
}

const onTimeUpdate = () => {
	if (videoRef.value) {
		state.currentTime = videoRef.value.currentTime
	}
}

const onVideoError = (e) => {
	console.error('Video error:', e)
	console.error('Video error details:', {
		error: e.target.error,
		networkState: e.target.networkState,
		readyState: e.target.readyState,
		src: e.target.src
	})
	state.isPlayerReady = false
}

const onPlay = () => {
	state.isPlaying = true
}

const onPause = () => {
	state.isPlaying = false
}
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
