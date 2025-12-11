import setuptools

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setuptools.setup(
    name="st-chat-input-multimodal",
    version="1.0.6",
    author="tsuzukia21",
    description="Streamlit multimodal chat input component with text, image, and voice support",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/tsuzukia21/st-chat-input-multimodal",
    packages=setuptools.find_packages(),
    include_package_data=True,
    classifiers=[
        "Development Status :: 5 - Production/Stable",
        "Intended Audience :: Developers",
        "Topic :: Software Development :: Libraries :: Python Modules",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
    ],
    python_requires=">=3.9",
    install_requires=[
        "streamlit >= 1.2",
    ],
    extras_require={
        "dev": [
            "pytest>=7.0",
            "pytest-cov>=4.0",
            "black>=22.0",
            "flake8>=5.0",
            "mypy>=1.0",
        ]
    },
    keywords="streamlit, component, multimodal, chat, input, image, voice, audio",
)
