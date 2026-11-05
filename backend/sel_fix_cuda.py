# Sel perbaikan CUDA: jalankan SETELAH Sel 2 dan SEBELUM Sel 3 (cukup sekali per sesi)
!pip -q install nvidia-cublas-cu12 nvidia-cudnn-cu12
import glob, os
def _preload_cuda_libs():
    """Colab may ship CUDA 13 while CTranslate2 wants CUDA 12 libs: load the pip 'nvidia-*-cu12' copies first."""
    import ctypes
    for mod, pat in (("nvidia.cublas.lib", "libcublas.so*"), ("nvidia.cudnn.lib", "libcudnn.so*")):
        try:
            pkg = __import__(mod, fromlist=["x"])
            for f in sorted(glob.glob(os.path.join(list(pkg.__path__)[0], pat))):
                ctypes.CDLL(f, mode=ctypes.RTLD_GLOBAL)
        except Exception:
            pass
_preload_cuda_libs()
