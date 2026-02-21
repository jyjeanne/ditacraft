import * as assert from 'assert';
import {
    createClassMatcher,
    matchesDitaClass,
    isLocalDita,
    TOPIC_TOPIC,
    TOPIC_XREF,
    TOPIC_LINK,
    TOPIC_IMAGE,
    MAP_MAP,
    MAP_TOPICREF,
    MAPGROUP_TOPICHEAD,
    TOPIC_TYPE_NAMES,
    MAP_TYPE_NAMES,
} from '../src/data/ditaSpecialization';

suite('ditaSpecialization', () => {
    suite('createClassMatcher', () => {
        test('extracts local name from class token', () => {
            const matcher = createClassMatcher(' topic/topic ');
            assert.strictEqual(matcher.localName, 'topic');
            assert.strictEqual(matcher.classToken, ' topic/topic ');
        });

        test('handles domain class tokens', () => {
            const matcher = createClassMatcher(' mapgroup-d/topichead ');
            assert.strictEqual(matcher.localName, 'topichead');
        });
    });

    suite('matchesDitaClass', () => {
        test('matches by @class attribute substring', () => {
            // concept has class "- topic/topic concept/concept "
            const classAttr = '- topic/topic concept/concept ';
            assert.ok(matchesDitaClass(classAttr, 'concept', TOPIC_TOPIC));
        });

        test('matches specialized element by base class', () => {
            // task topic matches topic/topic
            const classAttr = '- topic/topic task/task ';
            assert.ok(matchesDitaClass(classAttr, 'task', TOPIC_TOPIC));
        });

        test('does not match unrelated class', () => {
            const classAttr = '- topic/topic concept/concept ';
            assert.ok(!matchesDitaClass(classAttr, 'concept', MAP_MAP));
        });

        test('falls back to element name when @class is null', () => {
            assert.ok(matchesDitaClass(null, 'topic', TOPIC_TOPIC));
            assert.ok(!matchesDitaClass(null, 'concept', TOPIC_TOPIC));
        });

        test('falls back to element name when @class is undefined', () => {
            assert.ok(matchesDitaClass(undefined, 'xref', TOPIC_XREF));
            assert.ok(!matchesDitaClass(undefined, 'link', TOPIC_XREF));
        });

        test('matches xref with inline class', () => {
            const classAttr = '+ topic/xref ';
            assert.ok(matchesDitaClass(classAttr, 'xref', TOPIC_XREF));
        });

        test('matches link', () => {
            const classAttr = '+ topic/link ';
            assert.ok(matchesDitaClass(classAttr, 'link', TOPIC_LINK));
        });

        test('matches image', () => {
            const classAttr = '+ topic/image ';
            assert.ok(matchesDitaClass(classAttr, 'image', TOPIC_IMAGE));
        });

        test('matches topicref', () => {
            const classAttr = '- map/topicref ';
            assert.ok(matchesDitaClass(classAttr, 'topicref', MAP_TOPICREF));
        });

        test('matches chapter as topicref specialization', () => {
            const classAttr = '- map/topicref bookmap/chapter ';
            assert.ok(matchesDitaClass(classAttr, 'chapter', MAP_TOPICREF));
        });

        test('matches topichead', () => {
            const classAttr = '+ map/topicref mapgroup-d/topichead ';
            assert.ok(matchesDitaClass(classAttr, 'topichead', MAPGROUP_TOPICHEAD));
        });
    });

    suite('isLocalDita', () => {
        test('returns true for null scope and null format', () => {
            assert.ok(isLocalDita(null, null));
        });

        test('returns true for scope="local" and format="dita"', () => {
            assert.ok(isLocalDita('local', 'dita'));
        });

        test('returns false for scope="external"', () => {
            assert.ok(!isLocalDita('external', null));
        });

        test('returns false for format="pdf"', () => {
            assert.ok(!isLocalDita(null, 'pdf'));
        });

        test('returns true for scope="peer" and format="dita"', () => {
            assert.ok(isLocalDita('peer', 'dita'));
        });

        test('returns true for undefined scope and undefined format', () => {
            assert.ok(isLocalDita(undefined, undefined));
        });
    });

    suite('name sets', () => {
        test('TOPIC_TYPE_NAMES contains standard types', () => {
            assert.ok(TOPIC_TYPE_NAMES.has('topic'));
            assert.ok(TOPIC_TYPE_NAMES.has('concept'));
            assert.ok(TOPIC_TYPE_NAMES.has('task'));
            assert.ok(TOPIC_TYPE_NAMES.has('reference'));
            assert.ok(TOPIC_TYPE_NAMES.has('glossentry'));
            assert.ok(TOPIC_TYPE_NAMES.has('troubleshooting'));
        });

        test('MAP_TYPE_NAMES contains standard types', () => {
            assert.ok(MAP_TYPE_NAMES.has('map'));
            assert.ok(MAP_TYPE_NAMES.has('bookmap'));
            assert.ok(MAP_TYPE_NAMES.has('subjectScheme'));
        });
    });
});
